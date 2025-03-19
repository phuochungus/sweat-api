import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { FriendRequestStatus } from 'src/common/enums';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/entities';
@Entity('user_friend_request')
export class UserFriendRequest extends BaseEntity {
  @Column({ nullable: false })
  @ApiProperty()
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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiverUserId' })
  receiverUser!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderUserId' })
  senderUser!: User;
}
