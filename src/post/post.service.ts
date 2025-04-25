import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from 'src/entities/post.entity';
import { DataSource, Repository } from 'typeorm';
import { FilterPostsDto } from 'src/post/dto/filter-posts.dto';
import { PageDto, PageMetaDto } from 'src/common/dto';
import { PostMedia, PostReact, UserFriend } from 'src/entities';
import { ReactType } from 'src/common/enums';
import { FilterLikeDto } from 'src/post/dto/filter-like.dto';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    @InjectRepository(UserFriend)
    private readonly friendRepository: Repository<UserFriend>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createPostDto: CreatePostDto) {
    const post = this.postRepository.create(createPostDto);
    createPostDto.postMedia = createPostDto.postMedia.map((media) => {
      media.url = media.url.replace(
        process.env.AWS_S3_PUBLIC_URL,
        process.env.AWS_S3_CDN_URL,
      );
      const postMediaEntity = new PostMedia(media);
      return postMediaEntity;
    });
    post.mediaCount = createPostDto.postMedia.length;
    return await this.postRepository.save(post, { transaction: true });
  }

  async findAll(filterPostDto: FilterPostsDto, { currentUserId }) {
    const { createdBy, page, take, includes } = filterPostDto;
    const queryBuilder = this.dataSource.createQueryBuilder(Post, 'post');

    if (createdBy) {
      queryBuilder.andWhere('post.createdBy = :createdBy', { createdBy });
    }

    let [item, itemCount] = await Promise.all([
      queryBuilder
        .take(take)
        .skip((page - 1) * take)
        .getMany(),
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
      pageOptionsDto: { page, take },
    });
    return new PageDto(item, pageMetaDto);
  }

  async findOne(id: number) {
    return await this.postRepository.findOne({
      where: {
        id,
      },
      relations: {
        postMedia: true,
      },
    });
  }

  async update(id: number, updatePostDto: UpdatePostDto) {
    return await this.postRepository.update(id, updatePostDto);
  }

  async remove(id: number) {
    return await this.postRepository.delete(id);
  }

  async getFeed(userId: number, filterPostDto: FilterPostsDto) {
    const { page, take } = filterPostDto;

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
      .where('post.userId IN (:...userIds)', { userIds: friendIds })
      .orderBy('post.createdAt', 'DESC');

    const [items, itemCount] = await Promise.all([
      queryBuilder
        .take(take)
        .skip((page - 1) * take)
        .getMany(),
      queryBuilder.getCount(),
    ]);

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: { page, take },
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
    });
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
  }

  async getLikes({ postId, page, take }: FilterLikeDto & { postId: number }) {
    const queryBuilder = this.dataSource
      .createQueryBuilder(PostReact, 'react')
      .leftJoinAndSelect('react.user', 'user')
      .where('react.postId = :postId', { postId })
      .andWhere('react.type = :type', { type: ReactType.LIKE })
      .orderBy('react.createdAt', 'DESC');

    const [items, itemCount] = await Promise.all([
      queryBuilder
        .take(take)
        .skip((page - 1) * take)
        .getMany(),
      queryBuilder.getCount(),
    ]);

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: { page, take },
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
