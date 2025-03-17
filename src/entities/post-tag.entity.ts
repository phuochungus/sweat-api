import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Post } from './post.entity';

@Entity('post_tag')
export class PostTag extends BaseEntity {
  @Column()
  userId!: number;

  @Column()
  postId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Post, (post) => post.tags)
  @JoinColumn({ name: 'post_id' })
  post: Post;
}
