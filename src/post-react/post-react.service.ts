import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Post,
  PostComment,
  PostReact,
  User,
  UserNotification,
} from 'src/entities';
import { NotificationStatus, ReactType } from 'src/common/enums';
import { SOCIAL } from 'src/notification/enum';
import { TEMPLATE } from 'src/notification/template';

@Injectable()
export class PostReactService {
  constructor(
    @InjectRepository(PostReact)
    private readonly postReactRepository: Repository<PostReact>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostComment)
    private readonly postCommentRepository: Repository<PostComment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserNotification)
    private readonly userNotificationRepository: Repository<UserNotification>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * React to a post
   */
  async reactToPost(userId: number, postId: number) {
    // Check if post exists
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['user'],
    });

    if (!post) {
      throw new NotFoundException(`Post with id ${postId} not found`);
    }

    // Check if reaction already exists
    const existingReaction = await this.postReactRepository.findOne({
      where: { userId, postId },
    });

    if (existingReaction) {
      // If already reacted with same type, do nothing
      return existingReaction;
    }

    return this.dataSource.transaction(async (manager) => {
      // Create reaction with LIKE type by default (can be expanded with type parameter later)
      const postReact = this.postReactRepository.create({
        userId,
        postId,
        type: ReactType.LIKE,
      });

      await manager.save(postReact);

      // Increment post reaction count
      await manager
        .createQueryBuilder()
        .update(Post)
        .set({ reactCount: () => 'reactCount + 1' })
        .where('id = :id', { id: postId })
        .execute();

      // Add notification if reacting to someone else's post
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

      return postReact;
    });
  }

  /**
   * Remove reaction from a post
   */
  async removeReactionFromPost(userId: number, postId: number) {
    // Check if post exists
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post with id ${postId} not found`);
    }

    // Check if reaction exists
    const existingReaction = await this.postReactRepository.findOne({
      where: { userId, postId },
    });

    if (!existingReaction) {
      throw new NotFoundException(
        `Reaction on post with id ${postId} not found`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // Delete reaction
      await manager.delete(PostReact, existingReaction.id);

      // Decrement post reaction count
      await manager
        .createQueryBuilder()
        .update(Post)
        .set({ reactCount: () => 'GREATEST(reactCount - 1, 0)' })
        .where('id = :id', { id: postId })
        .execute();

      return { removed: true };
    });
  }

  /**
   * React to a comment
   */
  async reactToComment(userId: number, commentId: number) {
    // Check if comment exists
    const comment = await this.postCommentRepository.findOne({
      where: { id: commentId },
      relations: ['user', 'post'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with id ${commentId} not found`);
    }

    // Check if reaction already exists
    const existingReaction = await this.postReactRepository.findOne({
      where: { userId, commentId },
    });

    if (existingReaction) {
      // If already reacted, do nothing
      return existingReaction;
    }

    return this.dataSource.transaction(async (manager) => {
      // Create reaction with LIKE type by default
      const commentReact = this.postReactRepository.create({
        userId,
        commentId,
        type: ReactType.LIKE,
      });

      await manager.save(commentReact);

      // Increment comment reaction count
      await manager
        .createQueryBuilder()
        .update(PostComment)
        .set({ reactCount: () => 'reactCount + 1' })
        .where('id = :id', { id: commentId })
        .execute();

      // Add notification if reacting to someone else's comment
      if (comment.userId !== userId) {
        const currentUser = await manager.findOne(User, {
          where: { id: userId },
        });

        const notification = this.userNotificationRepository.create({
          receiverUserId: comment.userId,
          senderUserId: userId,
          postId: comment.postId,
          type: SOCIAL.REACT,
          status: NotificationStatus.UNREAD,
          text: TEMPLATE.REACT.replace('<n>', currentUser.fullname).replace(
            '<content>',
            comment.text.substring(0, 30) +
              (comment.text.length > 30 ? '...' : ''),
          ),
        });

        await manager.save(notification);
      }

      return commentReact;
    });
  }

  /**
   * Remove reaction from a comment
   */
  async removeReactionFromComment(userId: number, commentId: number) {
    // Check if comment exists
    const comment = await this.postCommentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with id ${commentId} not found`);
    }

    // Check if reaction exists
    const existingReaction = await this.postReactRepository.findOne({
      where: { userId, commentId },
    });

    if (!existingReaction) {
      throw new NotFoundException(
        `Reaction on comment with id ${commentId} not found`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // Delete reaction
      await manager.delete(PostReact, existingReaction.id);

      // Decrement comment reaction count
      await manager
        .createQueryBuilder()
        .update(PostComment)
        .set({ reactCount: () => 'GREATEST(reactCount - 1, 0)' })
        .where('id = :id', { id: commentId })
        .execute();

      // Add notification cleanup for comment reactions
      if (comment.userId !== userId) {
        await manager
          .createQueryBuilder()
          .delete()
          .from(UserNotification)
          .where('senderUserId = :userId', { userId })
          .andWhere('postId = :postId', { postId: comment.postId })
          .andWhere('receiverUserId = :receiverUserId', {
            receiverUserId: comment.userId,
          })
          .andWhere('type = :type', { type: SOCIAL.REACT })
          .execute();
      }

      return { removed: true };
    });
  }
}
