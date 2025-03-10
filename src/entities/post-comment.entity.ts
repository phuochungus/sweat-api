import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Post } from './post.entity';

@Entity('post_comment')
export class PostComment extends BaseEntity {
  @Column()
  user_id!: number;

  @Column()
  post_id!: number;

  @Column()
  text!: string;

  @Column({ nullable: true })
  reply_of?: number;

  @ManyToOne(() => User, (user) => user.comments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  parentCommentId?: number;
}
