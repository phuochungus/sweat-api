import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { DataSource, Repository } from 'typeorm';
import { User, UserFriend } from 'src/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { auth } from 'firebase-admin';
import { GetUserProfileDto } from './dto/get-user-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(UserFriend) private readonly friendRepository: Repository<UserFriend>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll() {
    return this.userRepository.find();
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }
  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.userRepository.update(id, updateUserDto);
    return this.userRepository.findOne({
      where: { id },
    });
  }

  /**
   * Generates a Firebase ID token for a user
   * This is primarily for development purposes
   * @param userId - The ID of the user to generate a token for
   * @returns A Firebase ID token
   */
  async generateFirebaseToken(userId: number): Promise<string> {
    let user: { firebaseId?: string } = await this.userRepository.findOne({
      where: { id: userId },
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
  async getUserProfile(userId: number, currentUserId?: number): Promise<GetUserProfileDto> {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    
    // Create and populate profile DTO
    const profileDto = new GetUserProfileDto();
    Object.assign(profileDto, {
      id: user.id,
      fullname: user.fullname,
      avatarUrl: user.avatarUrl ? user.avatarUrl.replace(process.env.AWS_S3_PUBLIC_URL, process.env.AWS_S3_CDN_URL) : null,
      coverUrl: user.coverUrl ? user.coverUrl.replace(process.env.AWS_S3_PUBLIC_URL, process.env.AWS_S3_CDN_URL) : null,
      bio: user.bio,
      birthday: user.birthday,
      gender: user.gender,
      friendCount: user.friendCount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
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
}
