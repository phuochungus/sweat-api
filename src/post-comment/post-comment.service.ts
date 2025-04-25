import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Post, PostComment, User, UserNotification } from 'src/entities';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { FilterPostCommentDto } from './dto/filter-post-comment.dto';
import { PageDto, PageMetaDto } from 'src/common/dto';
import { NotificationStatus } from 'src/common/enums';
import { SOCIAL } from 'src/notification/enum';
import { TEMPLATE } from 'src/notification/template';
import { UpdatePostCommentDto } from 'src/post-comment/dto';

@Injectable()
export class PostCommentService {
  constructor(
    @InjectRepository(PostComment)
    private postCommentRepository: Repository<PostComment>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(createPostCommentDto: CreatePostCommentDto, { currentUserId }) {
    const { postId, replyCommentId, text } = createPostCommentDto;

    // Verify the post exists
    const post = await this.postRepository.findOne({
      where: {
        id: postId,
      },
      relations: ['user'],
    });

    if (!post) {
      throw new NotFoundException(`Post with id ${postId} not found`);
    }

    let parentComment = null;
    if (replyCommentId) {
      parentComment = await this.postCommentRepository.findOne({
        where: {
          id: replyCommentId,
        },
        relations: ['user'],
      });

      if (!parentComment) {
        throw new NotFoundException(
          `Parent comment with id ${replyCommentId} not found`,
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      // Create the comment
      const comment = this.postCommentRepository.create({
        userId: currentUserId,
        postId,
        text,
        replyCommentId,
      });

      await manager.save(comment);

      // Increment post comment count
      await manager
        .createQueryBuilder()
        .update(Post)
        .set({
          commentCount: () => 'commentCount + 1',
        })
        .where('id = :id', { id: postId })
        .execute();

      // If it's a reply, increment the parent comment's reply count
      if (replyCommentId) {
        await manager
          .createQueryBuilder()
          .update(PostComment)
          .set({
            replyCount: () => 'replyCount + 1',
          })
          .where('id = :id', { id: replyCommentId })
          .execute();
      }

      // Create notifications
      const currentUser = await manager.findOne(User, {
        where: { id: currentUserId },
      });

      // Notify post author if the commenter is not the post author
      if (post.userId !== currentUserId) {
        await manager.save(
          manager.create(UserNotification, {
            receiverUserId: post.userId,
            senderUserId: currentUserId,
            postId,
            text: TEMPLATE.COMMENT.replace('<n>', currentUser.fullname).replace(
              '<content>',
              text.substring(0, 30) + (text.length > 30 ? '...' : ''),
            ),
            status: NotificationStatus.UNREAD,
            type: SOCIAL.COMMENT,
          }),
        );
      }

      // If it's a reply, also notify the parent comment author if different from commenter and post author
      if (
        replyCommentId &&
        parentComment.userId !== currentUserId &&
        parentComment.userId !== post.userId
      ) {
        await manager.save(
          manager.create(UserNotification, {
            receiverUserId: parentComment.userId,
            senderUserId: currentUserId,
            postId,
            text: TEMPLATE.COMMENT.replace('<n>', currentUser.fullname).replace(
              '<content>',
              text.substring(0, 30) + (text.length > 30 ? '...' : ''),
            ),
            status: NotificationStatus.UNREAD,
            type: SOCIAL.REPLY,
          }),
        );
      }

      return comment;
    });
  }

  async findAll(filterDto: FilterPostCommentDto, { currentUserId }) {
    const { page, take, postId, replyCommentId, includes } = filterDto;

    const queryBuilder = this.dataSource
      .createQueryBuilder(PostComment, 'comment')
      .leftJoinAndSelect('comment.user', 'user');

    if (postId) {
      queryBuilder.andWhere('comment.postId = :postId', { postId });
    }

    if (replyCommentId !== undefined) {
      if (replyCommentId === null) {
        queryBuilder.andWhere('comment.replyCommentId IS NULL');
      } else {
        queryBuilder.andWhere('comment.replyCommentId = :replyCommentId', {
          replyCommentId,
        });
      }
    }

    queryBuilder.orderBy('comment.createdAt', 'DESC');

    const [items, itemCount] = await Promise.all([
      queryBuilder
        .take(take)
        .skip((page - 1) * take)
        .getMany(),
      queryBuilder.getCount(),
    ]);

    // Check if user has reacted to the comments if requested
    if (includes?.includes('isReacted') && currentUserId) {
      for (const comment of items) {
        comment['isReacted'] = await this.isUserReactedToComment(
          currentUserId,
          comment.id,
        );
      }
    }

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: { page, take },
    });

    return new PageDto(items, pageMetaDto);
  }

  async findOne(id: number) {
    const comment = await this.postCommentRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return comment;
  }

  async update(
    id: number,
    updatePostCommentDto: UpdatePostCommentDto,
    { currentUserId },
  ) {
    const comment = await this.postCommentRepository.findOne({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    if (comment.userId !== currentUserId) {
      throw new NotFoundException(
        'You are not authorized to update this comment',
      );
    }

    await this.postCommentRepository.update(id, updatePostCommentDto);
    return this.findOne(id);
  }

  async remove(id: number, { currentUserId }) {
    const comment = await this.postCommentRepository.findOne({
      where: { id },
      relations: ['replies'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    if (comment.userId !== currentUserId) {
      throw new NotFoundException(
        'You are not authorized to delete this comment',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // If the comment has replies, delete them as well
      if (comment.replies && comment.replies.length > 0) {
        await manager.delete(PostComment, { replyCommentId: id });
      }

      // Delete the comment itself
      await manager.delete(PostComment, id);

      // Update the post's comment count
      await manager
        .createQueryBuilder()
        .update(Post)
        .set({
          commentCount: () =>
            `GREATEST(commentCount - ${1 + (comment.replies?.length || 0)}, 0)`,
        })
        .where('id = :id', { id: comment.postId })
        .execute();

      // If it's a reply, update the parent comment's reply count
      if (comment.replyCommentId) {
        await manager
          .createQueryBuilder()
          .update(PostComment)
          .set({
            replyCount: () => 'GREATEST(replyCount - 1, 0)',
          })
          .where('id = :id', { id: comment.replyCommentId })
          .execute();
      }

      return { success: true };
    });
  }

  private async isUserReactedToComment(userId: number, commentId: number) {
    const query = await this.dataSource
      .createQueryBuilder()
      .select('pr.id')
      .from('post_react', 'pr')
      .where('pr.userId = :userId', { userId })
      .andWhere('pr.commentId = :commentId', { commentId })
      .getRawOne();

    return !!query;
  }
}
