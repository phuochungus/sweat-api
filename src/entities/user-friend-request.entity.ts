import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('user_friend_request')
export class UserFriendRequest extends BaseEntity {
  @Column()
  user_id: number;

  @Column()
  target_user_id: number;

  @ManyToOne(() => User, (user) => user.sentFriendRequests)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, (user) => user.receivedFriendRequests)
  @JoinColumn({ name: 'target_user_id' })
  targetUser: User;
}
