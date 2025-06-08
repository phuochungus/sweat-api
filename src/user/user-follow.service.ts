import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserFollow, User, UserNotification } from 'src/entities';
import { PageDto, PageMetaDto } from 'src/common/dto';
import { NotificationStatus } from 'src/common/enums';
import { SOCIAL } from 'src/notification/enum';
import { TEMPLATE } from 'src/notification/template';

export interface FilterFollowDto {
  page?: number;
  limit?: number;
  search?: string;
}

@Injectable()
export class UserFollowService {
  constructor(
    @InjectRepository(UserFollow)
    private readonly userFollowRepository: Repository<UserFollow>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserNotification)
    private readonly userNotificationRepository: Repository<UserNotification>,
    private readonly dataSource: DataSource,
  ) {}

  async followUser(followerId: number, userId: number) {
    if (followerId === userId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Check if user exists
    const userToFollow = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!userToFollow) {
      throw new NotFoundException('User not found');
    }

    // Check if already following
    const existingFollow = await this.userFollowRepository.findOne({
      where: { followerId, userId },
    });
    if (existingFollow) {
      throw new BadRequestException('Already following this user');
    }

    // Create follow relationship
    const follow = this.userFollowRepository.create({
      followerId,
      userId,
    });

    return this.userFollowRepository.save(follow);
  }

  async unfollowUser(followerId: number, userId: number) {
    const follow = await this.userFollowRepository.findOne({
      where: { followerId, userId },
    });

    if (!follow) {
      throw new NotFoundException('Follow relationship not found');
    }

    await this.userFollowRepository.remove(follow);
    return { success: true };
  }

  async getFollowers(userId: number, filterDto: FilterFollowDto) {
    const { page = 1, limit = 10, search = '' } = filterDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select(['u.id', 'u.fullname', 'u.avatarUrl', 'u.bio'])
      .from(User, 'u')
      .innerJoin(UserFollow, 'uf', 'uf.followerId = u.id')
      .where('uf.userId = :userId', { userId });

    if (search) {
      queryBuilder.andWhere('u.fullname ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const [followers, total] = await Promise.all([
      queryBuilder.skip(skip).take(limit).getRawMany(),
      queryBuilder.getCount(),
    ]);
    const pageMetaDto = new PageMetaDto({
      itemCount: total,
      pageOptionsDto: { page, take: limit },
    });
    return new PageDto(followers, pageMetaDto);
  }

  async getFollowing(userId: number, filterDto: FilterFollowDto) {
    const { page = 1, limit = 10, search = '' } = filterDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select(['u.id', 'u.fullname', 'u.avatarUrl', 'u.bio'])
      .from(User, 'u')
      .innerJoin(UserFollow, 'uf', 'uf.userId = u.id')
      .where('uf.followerId = :followerId', { followerId: userId });

    if (search) {
      queryBuilder.andWhere('u.fullname ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const [following, total] = await Promise.all([
      queryBuilder.skip(skip).take(limit).getRawMany(),
      queryBuilder.getCount(),
    ]);
    const pageMetaDto = new PageMetaDto({
      itemCount: total,
      pageOptionsDto: { page, take: limit },
    });
    return new PageDto(following, pageMetaDto);
  }

  async checkFollowStatus(followerId: number, userId: number) {
    const follow = await this.userFollowRepository.findOne({
      where: { followerId, userId },
    });
    return { isFollowing: !!follow };
  }

  async getFollowerIds(userId: number): Promise<number[]> {
    const followers = await this.userFollowRepository.find({
      where: { userId },
      select: ['followerId'],
    });
    return followers.map((f) => f.followerId);
  }
  async notifyFollowers(
    userId: number,
    type: SOCIAL,
    message: string,
    data: any = {},
    excludeUserIds: number[] = [],
  ) {
    const followerIds = await this.getFollowerIds(userId);

    if (followerIds.length === 0) return;

    // Filter out excluded users (e.g., post owner to avoid duplicate notifications)
    const filteredFollowerIds = followerIds.filter(
      (followerId) => !excludeUserIds.includes(followerId),
    );

    if (filteredFollowerIds.length === 0) return;

    const notifications = filteredFollowerIds.map((followerId) => ({
      receiverUserId: followerId,
      senderUserId: userId,
      text: message,
      type,
      status: NotificationStatus.UNREAD,
      data,
      postId: data.postId || null,
    }));

    await this.userNotificationRepository.save(notifications);
  }
}
