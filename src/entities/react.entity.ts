import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { ReactType } from 'src/common/enums';
import { Post } from 'src/entities/post.entity';
import { PostComment } from 'src/entities/post-comment.entity';

@Entity('post_react')
export class React extends BaseEntity {
  @Column({ type: 'enum', enum: ReactType })
  type!: ReactType;

  @Column()
  userId!: number;

  @Column({ nullable: true })
  commentId?: number;

  @Column({ nullable: true })
  postId?: number;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Post, { nullable: true })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @ManyToOne(() => PostComment, { nullable: true })
  @JoinColumn({ name: 'commentId' })
  postComment: PostComment;
}
