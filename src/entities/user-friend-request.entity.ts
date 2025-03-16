import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { FriendRequestStatus } from 'src/common/enums';
@Entity('user_friend_request')
export class UserFriendRequest extends BaseEntity {
  @Column()
  senderUserId!: number;

  @Column()
  receiverUserId!: number;

  @Column({
    type: 'enum',
    enum: FriendRequestStatus,
    default: FriendRequestStatus.PENDING,
  })
  status!: string;
}
