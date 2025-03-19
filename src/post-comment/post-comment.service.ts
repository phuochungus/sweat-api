import { Injectable } from '@nestjs/common';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { DataSource } from 'typeorm';
import { FilterPostCommentDto } from 'src/post-comment/dto/filter-post-comment.dto';
import { PostComment } from 'src/entities';
import { PageDto, PageMetaDto } from 'src/common/dto';

@Injectable()
export class PostCommentService {
  constructor(private readonly dataSource: DataSource) {}
  async create(createPostCommentDto: CreatePostCommentDto) {
    return await this.dataSource
      .createQueryBuilder()
      .insert()
      .into('post_comment')
      .values(createPostCommentDto)
      .execute();
  }

  async findAll(filterPostCommentDto: FilterPostCommentDto) {
    const { page, postId, replyCommentId, take } = filterPostCommentDto;
    const queryBuilder = this.dataSource.createQueryBuilder(
      PostComment,
      'post_comment',
    );
    if (postId) {
      queryBuilder.andWhere('post_comment.postId = :postId', { postId });
    }

    if (replyCommentId) {
      queryBuilder.andWhere('post_comment.replyCommentId = :replyCommentId', {
        replyCommentId,
      });
    }

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

  async remove(id: number) {
    return await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('post_comment')
      .where('id = :id', { id })
      .execute();
  }
}
