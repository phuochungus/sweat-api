import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { FriendRequestStatus } from 'src/common/enums';
import { ApiProperty } from '@nestjs/swagger';
@Entity('user_friend_request')
export class UserFriendRequest extends BaseEntity {
  @Column({ nullable: false })
  senderUserId!: number;

  @Column({ nullable: false })
  @ApiProperty()
  receiverUserId!: number;

  @ApiProperty({ enum: FriendRequestStatus })
  @Column({
    type: 'enum',
    enum: FriendRequestStatus,
    default: FriendRequestStatus.PENDING,
  })
  status!: FriendRequestStatus;
}
