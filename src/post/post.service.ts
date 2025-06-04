import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
import {
  MediaType,
  NotificationStatus,
  PostPrivacy,
  ReactType,
} from 'src/common/enums';
import { FilterLikeDto } from 'src/post/dto/filter-like.dto';
import { SOCIAL } from 'src/notification/enum';
import { TEMPLATE } from 'src/notification/template';
import { ImageProcessingService } from 'src/image-processing/image-processing.service';
import { VideoProcessingService } from 'src/video-processing/video-processing.service';
import { NSFWDetectionService } from 'src/nsfw-detection/nsfw-detection.service';
import { PostValidationService } from 'src/post-validation/post-validation.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

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
    private readonly nsfwDetectionService: NSFWDetectionService,
    private readonly postValidationService: PostValidationService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}
  async create(createPostDto: CreatePostDto) {
    createPostDto.text = createPostDto.text?.trim() || '';
    // Extract image URLs to check for NSFW content
    const imageUrls = createPostDto.postMedia
      .filter((media) => this.isImageFile(media.url))
      .map((media) => media.url);

    // Validate images before creating the post
    const nsfwCheckEnabled = await this.cacheManager.get(
      'server_side_check_nsfw',
    );
    if (imageUrls.length > 0 && nsfwCheckEnabled) {
      await this.nsfwDetectionService.validateImagesForPost(imageUrls);
    }

    // Validate post content with Gemini AI
    const postValidationEnabled =
      (await this.cacheManager.get('enable_post_validation')) ?? false;

    if (postValidationEnabled) {
      try {
        // Validate the post - will work for both image posts and text-only posts
        await this.postValidationService.validateAndCheckPost(
          null,
          createPostDto.text,
        );
      } catch (error) {
        console.error('Post validation failed:', error);
        // Re-throw the error to be handled by the controller
        throw error;
      }
    }

    // Process media asynchronously to generate video thumbnails when needed
    createPostDto.postMedia = await Promise.all(
      createPostDto.postMedia.map(async (media) => {
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
        } else if (
          this.isVideoFile(media.url) ||
          media.type === MediaType.VIDEO
        ) {
          this.videoProcessingService.addProcessingJob({
            url: media.url,
            s3_key: s3Key,
          });

          // Generate video thumbnail
          try {
            const thumbnailUrl =
              await this.videoProcessingService.generateVideoThumbnail(
                media.url,
              );
            media.videoThumbnail = thumbnailUrl;
          } catch (error) {
            console.error('Error generating video thumbnail:', error);
            // Continue without thumbnail if generation fails
          }
        }

        const postMediaEntity = new PostMedia(media);
        return postMediaEntity;
      }),
    );
    const post = this.postRepository.create(createPostDto);
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

    if (includes?.includes('isFeatPost')) {
      queryBuilder.andWhere('post.mediaCount > 0');
    }

    if (query) {
      queryBuilder.where('post.text ILIKE :query', {
        query: `%${query}%`,
      });
    }
    if (createdBy) {
      queryBuilder.andWhere('post.userId = :userId', { userId: createdBy });
    }
    const friendIds = [currentUserId];
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
    queryBuilder.andWhere(
      '(post.userId IN (:...friendIds) OR post.privacy = :publicPrivacy)',
      {
        friendIds,
        publicPrivacy: PostPrivacy.PUBLIC,
      },
    );

    if (!createdBy) {
      queryBuilder.take(takeNum).skip(skip);
    }
    let [item, itemCount] = await Promise.all([
      queryBuilder.getMany(),
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

    delete (updatePostDto as any).postMedia;

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

    // Check if user already liked the post
    const existingReaction = await this.isUserReactedToPost(userId, postId);
    if (existingReaction) {
      return {
        success: false,
        message: 'Post already liked',
      };
    }

    // Insert reaction
    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into('post_react')
      .values({
        userId,
        postId,
        type: ReactType.LIKE,
      })
      .execute();

    // Increment react count
    await this.dataSource
      .createQueryBuilder()
      .update(Post)
      .set({
        reactCount: () => '"reactCount" + 1',
        updatedAt: new Date(),
      })
      .where('id = :id', { id: postId })
      .execute();

    // Create notification if liking someone else's post
    if (post.userId != userId) {
      const currentUser = await this.dataSource
        .createQueryBuilder(User, 'user')
        .where('user.id = :id', { id: userId })
        .getOne();

      if (currentUser) {
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

        await this.userNotificationRepository.save(notification);
      }
    }

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

    // Check if user has liked the post
    const existingReaction = await this.isUserReactedToPost(userId, postId);
    if (!existingReaction) {
      return {
        success: false,
        message: 'Post not liked by user',
      };
    }

    // Remove reaction
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('post_react')
      .where('userId = :userId AND postId = :postId', { userId, postId })
      .execute();

    // Decrement react count only if reactCount > 0
    await this.dataSource
      .createQueryBuilder()
      .update(Post)
      .set({
        reactCount: () => 'GREATEST("reactCount" - 1, 0)',
        updatedAt: new Date(),
      })
      .where('id = :id', { id: postId })
      .execute();

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
