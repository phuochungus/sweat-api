import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('user_friend')
export class UserFriend extends BaseEntity {
  @Column()
  user_id1: number;

  @Column()
  user_id2: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id1' })
  user1: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id2' })
  user2: User;
}
