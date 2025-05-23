import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from 'src/entities/post.entity';
import { Brackets, DataSource, Repository } from 'typeorm';
import { FilterPostsDto } from 'src/post/dto/filter-posts.dto';
import { PageDto, PageMetaDto } from 'src/common/dto';
import {
  PostMedia,
  PostReact,
  User,
  UserFriend,
  UserNotification,
} from 'src/entities';
import { NotificationStatus, PostPrivacy, ReactType } from 'src/common/enums';
import { FilterLikeDto } from 'src/post/dto/filter-like.dto';
import { SOCIAL } from 'src/notification/enum';
import { TEMPLATE } from 'src/notification/template';
import { ImageProcessingService } from 'src/image-processing/image-processing.service';
import { VideoProcessingService } from 'src/video-processing/video-processing.service';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    @InjectRepository(UserFriend)
    private readonly friendRepository: Repository<UserFriend>,
    private readonly dataSource: DataSource,
    @InjectRepository(UserNotification)
    private readonly userNotificationRepository: Repository<UserNotification>,
    private readonly imageProcessingService: ImageProcessingService,
    private readonly videoProcessingService: VideoProcessingService,
  ) {}

  async create(createPostDto: CreatePostDto) {
    const post = this.postRepository.create(createPostDto);
    createPostDto.postMedia = createPostDto.postMedia.map((media) => {
      media.url = media.url.replace(
        process.env.AWS_S3_PUBLIC_URL,
        process.env.AWS_S3_CDN_URL,
      );

      // Extract S3 key from URL
      const s3Key = media.url
        .replace(process.env.AWS_S3_CDN_URL, '')
        .replace(process.env.AWS_S3_PUBLIC_URL, '');

      // Add media processing job to the appropriate queue based on media type
      if (this.isImageFile(media.url)) {
        this.imageProcessingService.addProcessingJob({
          url: media.url,
          s3_key: s3Key,
        });
      } else if (this.isVideoFile(media.url)) {
        this.videoProcessingService.addProcessingJob({
          url: media.url,
          s3_key: s3Key,
        });
      }

      const postMediaEntity = new PostMedia(media);
      return postMediaEntity;
    });
    post.mediaCount = createPostDto.postMedia.length;
    return await this.postRepository.save(post, { transaction: true });
  }

  // Helper method to determine if a file is an image
  private isImageFile(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some((ext) => url.toLowerCase().endsWith(ext));
  }

  // Helper method to determine if a file is a video
  private isVideoFile(url: string): boolean {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
    return videoExtensions.some((ext) => url.toLowerCase().endsWith(ext));
  }

  async findAll(filterPostDto: FilterPostsDto, { currentUserId }) {
    const { createdBy, page = 1, take = 10, includes, query } = filterPostDto;

    // Ensure page and take are numbers
    const pageNum = Number(page);
    const takeNum = Number(take);
    const skip = (pageNum - 1) * takeNum;

    const queryBuilder = this.dataSource
      .createQueryBuilder(Post, 'post')
      .orderBy('post.createdAt', 'DESC')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.postMedia', 'postMedia')
      .where('post.deletedAt IS NULL');

    if (query) {
      queryBuilder.where('post.text ILIKE :query', {
        query: `%${query}%`,
      });
    }
    if (createdBy) {
      queryBuilder.andWhere('post.userId = :userId', { userId: createdBy });
    } else {
      const friendIds = [];
      if (currentUserId) {
        // Get user's friends
        const friends = await this.friendRepository.find({
          where: [{ userId1: currentUserId }, { userId2: currentUserId }],
        });

        // Extract friend IDs
        friends.forEach((friend) => {
          if (friend.userId1 === currentUserId) {
            friendIds.push(friend.userId2);
          } else {
            friendIds.push(friend.userId1);
          }
        });
      }

      // Replace the simple condition with the complex one using Brackets
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('post.privacy = :publicPrivacy', {
            publicPrivacy: PostPrivacy.PUBLIC,
          }).orWhere(
            new Brackets((innerQb) => {
              innerQb
                .where('post.privacy = :friendPrivacy', {
                  friendPrivacy: PostPrivacy.FRIEND,
                })
                .andWhere(
                  friendIds.length > 0
                    ? 'post.userId IN (:...friendIds)'
                    : '1=0', // If no friends, this condition should never match
                  { friendIds },
                );
            }),
          );
        }),
      );
    }

    let [item, itemCount] = await Promise.all([
      queryBuilder.take(takeNum).skip(skip).getMany(),
      queryBuilder.getCount(),
    ]);

    if (currentUserId && includes?.includes('isReacted')) {
      item = await Promise.all(
        item.map(async (post) => ({
          ...post,
          isReacted: await this.isUserReactedToPost(currentUserId, post.id),
        })),
      );
    }

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: { page: pageNum, take: takeNum },
    });
    return new PageDto(item, pageMetaDto);
  }

  async findOne(id: number) {
    const post = await this.postRepository.findOne({
      where: {
        id,
      },
      relations: {
        postMedia: true,
        user: true, // Add user relation
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto) {
    const post = await this.postRepository.findOne({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    await this.postRepository.update(id, updatePostDto);

    // Return the updated post
    return this.postRepository.findOne({
      where: { id },
    });
  }

  async remove(id: number) {
    return await this.postRepository.softDelete(id);
  }

  async getFeed(userId: number, filterPostDto: FilterPostsDto) {
    const { page = 1, take = 10, query } = filterPostDto;

    // Ensure page and take are numbers
    const pageNum = Number(page);
    const takeNum = Number(take);
    const skip = (pageNum - 1) * takeNum;

    // Get all friends of the user
    const friends = await this.friendRepository.find({
      where: [{ userId1: userId }, { userId2: userId }],
    });

    // Extract friend IDs
    const friendIds = friends.map((friend) =>
      friend.userId1 === userId ? friend.userId2 : friend.userId1,
    );

    // Add the user's own ID to the list
    friendIds.push(userId);

    const queryBuilder = this.dataSource
      .createQueryBuilder(Post, 'post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.postMedia', 'postMedia')
      .orderBy('post.createdAt', 'DESC');

    if (friendIds) {
      queryBuilder.andWhere('post.userId IN (:...friendIds)', {
        friendIds,
      });
    }

    if (query) {
      queryBuilder.andWhere('post.content ILIKE :query', {
        query: `%${query}%`,
      });
    }

    const [items, itemCount] = await Promise.all([
      queryBuilder.take(takeNum).skip(skip).getMany(),
      queryBuilder.getCount(),
    ]);

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: { page: pageNum, take: takeNum },
    });

    return new PageDto(items, pageMetaDto);
  }

  async likePost(userId: number, postId: number) {
    const post = await this.postRepository.findOne({
      where: {
        id: postId,
      },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .insert()
        .into('post_react')
        .values({
          userId,
          postId,
          type: ReactType.LIKE,
        })
        .execute();

      await manager
        .createQueryBuilder()
        .update(Post)
        .set({
          reactCount: () => '"reactCount" + 1',
        })
        .where('id = :id', { id: postId })
        .execute();
      if (post.userId != userId) {
        const currentUser = await manager.findOne(User, {
          where: { id: userId },
        });

        const notification = this.userNotificationRepository.create({
          receiverUserId: post.userId,
          senderUserId: userId,
          postId,
          type: SOCIAL.REACT,
          status: NotificationStatus.UNREAD,
          text: TEMPLATE.REACT.replace('<n>', currentUser.fullname).replace(
            '<content>',
            post.text.substring(0, 30) + (post.text.length > 30 ? '...' : ''),
          ),
        });

        await manager.save(notification);
      }
    });

    // Return an object with success status
    return {
      success: true,
      message: 'Post liked successfully',
    };
  }

  async unlikePost(userId: number, postId: number) {
    const post = await this.postRepository.findOne({
      where: {
        id: postId,
      },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from('post_react')
        .where('userId = :userId AND postId = :postId', { userId, postId })
        .execute();

      await manager
        .createQueryBuilder()
        .update(Post)
        .set({
          reactCount: () => '"reactCount" - 1',
        })
        .where('id = :id', { id: postId })
        .execute();
    });

    // Return an object with success status
    return {
      success: true,
      message: 'Post unliked successfully',
    };
  }

  async getLikes({
    postId,
    page = 1,
    take = 20,
  }: FilterLikeDto & { postId: number }) {
    // Ensure page and take are numbers
    const pageNum = Number(page);
    const takeNum = Number(take);
    const skip = (pageNum - 1) * takeNum;

    const queryBuilder = this.dataSource
      .createQueryBuilder(PostReact, 'react')
      .leftJoinAndSelect('react.user', 'user')
      .where('react.postId = :postId', { postId })
      .andWhere('react.type = :type', { type: ReactType.LIKE })
      .orderBy('react.createdAt', 'DESC');

    const [items, itemCount] = await Promise.all([
      queryBuilder.take(takeNum).skip(skip).getMany(),
      queryBuilder.getCount(),
    ]);

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: { page: pageNum, take: takeNum },
    });

    return new PageDto(items, pageMetaDto);
  }

  private async isUserReactedToPost(userId: number, postId: number) {
    const query = await this.dataSource
      .createQueryBuilder(PostReact, 'react')
      .where('react.userId = :userId', { userId })
      .andWhere('react.postId = :postId', { postId })
      .getOne();
    return query;
  }
}
