import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from 'src/entities/post.entity';
import { DataSource, Repository } from 'typeorm';
import { FilterPostsDto } from 'src/post/dto/filter-posts.dto';
import { PageDto, PageMetaDto } from 'src/common/dto';
import { UserFriend } from 'src/entities';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    @InjectRepository(UserFriend)
    private readonly friendRepository: Repository<UserFriend>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createPostDto: CreatePostDto) {
    return await this.postRepository.insert(createPostDto);
  }

  async findAll(filterPostDto: FilterPostsDto, { currentUserId }) {
    const { createdBy, isReel, page, take } = filterPostDto;
    const queryBuilder = this.dataSource.createQueryBuilder(Post, 'post');

    if (createdBy) {
      queryBuilder.andWhere('post.createdBy = :createdBy', { createdBy });
    }

    if (isReel) {
      queryBuilder.andWhere('post.media_count = 1');
    }

    const [item, itemCount] = await Promise.all([
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
    return new PageDto(item, pageMetaDto);
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
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
}
