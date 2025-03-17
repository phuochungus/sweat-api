import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { NotificationStatus } from 'src/common/enums';
import { SOCIAL } from 'src/user-notification/enum';
@Entity('user_notification')
export class UserNotification extends BaseEntity {
  @Column()
  receiverUserId!: number;

  @Column()
  text!: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status!: NotificationStatus;

  @Column({ type: 'enum', enum: SOCIAL })
  type: SOCIAL;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
