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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
