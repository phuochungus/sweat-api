import { Injectable } from '@nestjs/common';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { DataSource } from 'typeorm';
import { FilterPostCommentDto } from 'src/post-comment/dto/filter-post-comment.dto';
import { Post, PostComment, React } from 'src/entities';
import { PageDto, PageMetaDto } from 'src/common/dto';

@Injectable()
export class PostCommentService {
  constructor(private readonly dataSource: DataSource) {}
  async create(createPostCommentDto: CreatePostCommentDto, { currentUserId }) {
    return await this.dataSource.transaction(async (manager) => {
      const postComment = new PostComment();
      postComment.text = createPostCommentDto.text;
      postComment.postId = createPostCommentDto.postId;
      postComment.replyCommentId = createPostCommentDto.replyCommentId;
      postComment.userId = currentUserId;
      const [comment, post] = await Promise.all([
        manager.findOne(PostComment, {
          where: { id: createPostCommentDto.replyCommentId },
        }),
        manager.findOne(Post, { where: { id: createPostCommentDto.postId } }),
      ]);
      if (comment) {
        comment.replyCount++;
        await manager.save(comment);
        await manager.save(postComment);
      }
      if (post) {
        post.reactCount++;
        await manager.save(post);
        await manager.save(postComment);
      }
    });
  }

  async findAll(filterPostCommentDto: FilterPostCommentDto, { currentUserId }) {
    const { page, postId, replyCommentId, take, includes } =
      filterPostCommentDto;
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

    let [items, itemCount] = await Promise.all([
      queryBuilder
        .take(take)
        .skip((page - 1) * take)
        .getMany(),
      queryBuilder.getCount(),
    ]);

    if (currentUserId && includes?.includes('isReacted')) {
      items = await Promise.all(
        items.map(async (postComment) => ({
          ...postComment,
          isReacted: await this.isUserReactedToPostComment(
            currentUserId,
            postComment.id,
          ),
        })),
      );
    }

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

  private async isUserReactedToPostComment(
    userId: number,
    postCommentId: number,
  ) {
    const query = await this.dataSource
      .createQueryBuilder(React, 'react')
      .where('react.userId = :userId', { userId })
      .andWhere('react.postCommentId = :postCommentId', { postCommentId })
      .getOne();
    return query;
  }
}
