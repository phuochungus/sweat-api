import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Post } from './post.entity';

@Entity('post_comment')
export class PostComment extends BaseEntity {
  @Column()
  userId!: number;

  @Column()
  postId!: number;

  @Column()
  text!: string;

  @Column({ nullable: true })
  replyOf?: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  parentCommentId?: number;
}
