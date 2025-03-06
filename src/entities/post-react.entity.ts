import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Post } from './post.entity';
import { ReactType } from 'src/common/enums';

@Entity('post_react')
export class PostReact extends BaseEntity {
  @Column({ type: 'enum', enum: ReactType })
  type!: ReactType;

  @Column()
  user_id!: number;

  @Column()
  post_id!: number;

  @ManyToOne(() => User, (user) => user.reacts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Post, (post) => post.reacts)
  @JoinColumn({ name: 'post_id' })
  post: Post;
}
