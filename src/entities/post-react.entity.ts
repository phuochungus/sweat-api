import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { ReactType } from 'src/common/enums';

@Entity('post_react')
export class PostReact extends BaseEntity {
  @Column({ type: 'enum', enum: ReactType })
  type!: ReactType;

  @Column()
  userId!: number;

  @Column()
  postId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
