import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { DataSource, Repository } from 'typeorm';
import { User, UserFriend, UserFriendRequest } from 'src/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { auth } from 'firebase-admin';
import { GetUserProfileDto } from './dto/get-user-profile.dto';
import { FriendRequestStatus } from 'src/common/enums';
import { FilterFriendsDto } from 'src/friend/dto/filter-friend.dto';
import { PageDto, PageMetaDto } from 'src/common/dto';
import { FriendService } from 'src/friend/friend.service';
import { UserFollowService } from 'src/user/user-follow.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(UserFriend)
    private readonly friendRepository: Repository<UserFriend>,
    @InjectRepository(UserFriendRequest)
    private readonly friendRequestRepository: Repository<UserFriendRequest>,
    private readonly dataSource: DataSource,
    private readonly friendService: FriendService,
    private readonly userFollowService: UserFollowService,
  ) {}

  async findAll(filterDto: FilterFriendsDto, { currentUserId }) {
    const { page = 1, take = 10, query, includes } = filterDto;
    const pageNum = Number(page);
    const takeNum = Number(take);
    const skip = (pageNum - 1) * takeNum;
    const queryBuilder = this.dataSource
      .createQueryBuilder(User, 'u')
      .where('u.deletedAt IS NULL');
    if (query) {
      queryBuilder.andWhere(
        'unaccent(LOWER(u.fullname)) ILIKE unaccent(LOWER(:query))',
        {
          query: `%${filterDto.query}%`,
        },
      );
    }
    let [item, itemCount] = await Promise.all([
      queryBuilder.take(takeNum).skip(skip).getMany(),
      queryBuilder.getCount(),
    ]);

    if (includes?.includes('mutualFriendsCount') && currentUserId) {
      item = await Promise.all(
        item.map(async (friend) => {
          const mutualFriends = await this.friendService.getMutualFriends(
            currentUserId,
            friend.id,
          );
          return {
            ...friend,
            mutualFriends: mutualFriends,
            mutualFriendsCount: mutualFriends.length,
          };
        }),
      );
    }
    if (includes?.includes('pendingRequest')) {
      item = await Promise.all(
        item.map(async (friend) => {
          const pendingRequest = await this.friendRequestRepository
            .createQueryBuilder('uf')
            .where(
              `(uf.senderUserId = :currentUserId AND uf.receiverUserId = :friendId) OR (uf.receiverUserId = :currentUserId AND uf.senderUserId = :friendId)`,
              { currentUserId, friendId: friend.id },
            )
            .getOne();
          return {
            ...friend,
            pendingRequest: pendingRequest,
          };
        }),
      );
    }
    // add isFriend to each user
    if (currentUserId) {
      item = await Promise.all(
        item.map(async (friend) => {
          const friendship = await this.friendRepository.findOne({
            where: [
              { userId1: currentUserId, userId2: friend.id },
              { userId1: friend.id, userId2: currentUserId },
            ],
          });
          return {
            ...friend,
            isFriend: !!friendship,
          };
        }),
      );
    }

    return new PageDto(
      item,
      new PageMetaDto({
        itemCount,
        pageOptionsDto: { page: pageNum, take: takeNum },
      }),
    );
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: null },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }
  async update(id: number, updateUserDto: UpdateUserDto) {
    console.log('Updating user with ID:', id);
    console.log('Update data:', updateUserDto);
    await this.userRepository.update({ id }, updateUserDto);
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: null },
    });
    console.log(user);
    return user;
  }

  /**
   * Generates a Firebase ID token for a user
   * This is primarily for development purposes
   * @param userId - The ID of the user to generate a token for
   * @returns A Firebase ID token
   */
  async generateFirebaseToken(userId: number): Promise<string> {
    const user: { firebaseId?: string } = await this.userRepository.findOne({
      where: { id: userId, deletedAt: null },
    });

    if (!user || !user.firebaseId) {
      throw new BadRequestException('User not found or Firebase ID not set');
    }

    const customToken = await auth().createCustomToken(user.firebaseId);
    // Exchange custom token for ID token using Firebase Auth REST API
    const response = await fetch(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Firebase token exchange failed: ${JSON.stringify(errorData)}`,
      );
    }

    const data = await response.json();
    return data.idToken as string;
  }

  /**
   * Gets a user's profile by ID
   * @param userId - The ID of the user to get the profile for
   * @param currentUserId - Optional ID of the current user to check friendship status
   * @returns User profile data with friendship status if currentUserId is provided
   * @throws {NotFoundException} When user with given ID is not found
   */
  async getUserProfile(userId: number, currentUserId?: number) {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: null },
    });

    const pendingFriendRequest = await this.friendRequestRepository.findOne({
      where: [
        {
          senderUserId: userId,
          receiverUserId: currentUserId,
          status: FriendRequestStatus.PENDING,
        },
        {
          senderUserId: currentUserId,
          receiverUserId: userId,
          status: FriendRequestStatus.PENDING,
        },
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const followStatus = await this.userFollowService.checkFollowStatus(
      currentUserId,
      userId,
    );
    const profileDto = new GetUserProfileDto();
    Object.assign(profileDto, {
      id: user.id,
      fullname: user.fullname,
      avatarUrl: user.avatarUrl
        ? user.avatarUrl.replace(
            process.env.AWS_S3_PUBLIC_URL,
            process.env.AWS_S3_CDN_URL,
          )
        : null,
      coverUrl: user.coverUrl
        ? user.coverUrl.replace(
            process.env.AWS_S3_PUBLIC_URL,
            process.env.AWS_S3_CDN_URL,
          )
        : null,
      bio: user.bio,
      birthday: user.birthday,
      gender: user.gender,
      friendCount: user.friendCount,
      pendingFriendRequest: pendingFriendRequest,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      firebaseId: user?.firebaseId,
      isFollowing: followStatus.isFollowing,
    });

    // Check friendship status if currentUserId is provided and different from requested profile
    if (currentUserId && currentUserId !== userId) {
      const friendship = await this.friendRepository.findOne({
        where: [
          { userId1: currentUserId, userId2: userId },
          { userId1: userId, userId2: currentUserId },
        ],
      });

      profileDto.isFriend = !!friendship;
    } else if (currentUserId === userId) {
      // If viewing own profile, set isFriend to true for consistency
      profileDto.isFriend = true;
    } else {
      profileDto.isFriend = false;
    }

    return profileDto;
  }

  /**
   * Gets a user's profile by Firebase ID
   * @param firebaseId - The Firebase ID of the user to get the profile for
   * @param currentUserId - Optional ID of the current user to check friendship status
   * @returns User profile data with friendship status if currentUserId is provided
   * @throws {NotFoundException} When user with given Firebase ID is not found
   */
  async getUserProfileByFirebaseId(firebaseId: string, currentUserId?: number) {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { firebaseId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(
        `User with Firebase ID ${firebaseId} not found`,
      );
    }

    const pendingFriendRequest = await this.friendRequestRepository.findOne({
      where: [
        {
          senderUserId: user.id,
          receiverUserId: currentUserId,
          status: FriendRequestStatus.PENDING,
        },
        {
          senderUserId: currentUserId,
          receiverUserId: user.id,
          status: FriendRequestStatus.PENDING,
        },
      ],
    });

    // Create and populate profile DTO
    const profileDto = new GetUserProfileDto();
    Object.assign(profileDto, {
      id: user.id,
      fullname: user.fullname,
      avatarUrl: user.avatarUrl
        ? user.avatarUrl.replace(
            process.env.AWS_S3_PUBLIC_URL,
            process.env.AWS_S3_CDN_URL,
          )
        : null,
      coverUrl: user.coverUrl
        ? user.coverUrl.replace(
            process.env.AWS_S3_PUBLIC_URL,
            process.env.AWS_S3_CDN_URL,
          )
        : null,
      bio: user.bio,
      birthday: user.birthday,
      gender: user.gender,
      friendCount: user.friendCount,
      pendingFriendRequest: pendingFriendRequest,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      firebaseId: user?.firebaseId,
    });

    // Check friendship status if currentUserId is provided and different from requested profile
    if (currentUserId && currentUserId !== user.id) {
      const friendship = await this.friendRepository.findOne({
        where: [
          { userId1: currentUserId, userId2: user.id },
          { userId1: user.id, userId2: currentUserId },
        ],
      });

      profileDto.isFriend = !!friendship;
    } else if (currentUserId === user.id) {
      // If viewing own profile, set isFriend to true for consistency
      profileDto.isFriend = true;
    } else {
      profileDto.isFriend = false;
    }

    return profileDto;
  }

  /**
   * Soft deletes a user by setting the deletedAt field
   * @param userId - The ID of the user to delete
   * @returns The deleted user
   * @throws {NotFoundException} When user with given ID is not found
   */
  async softDelete(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await auth().deleteUser(user.firebaseId);
    user.firebaseId = null; // Clear Firebase ID
    await this.userRepository.update(userId, {
      firebaseId: null,
      fullname: `Deleted User ${userId}`,
    });

    // Clean up friendships for the deleted user
    await this.friendService.cleanUpFriendshipsForDeletedUser(userId);

    return { message: 'User account deleted successfully' };
  }
}
