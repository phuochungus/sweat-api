import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { NOTIFICATION_TYPE, NotificationStatus } from 'src/common/enums';
@Entity('user_notification')
export class UserNotification extends BaseEntity {
  @Column()
  receiver_id!: number;

  @Column()
  text!: string;

  @Column({ type: 'enum', enum: NotificationStatus })
  status!: NotificationStatus;

  @Column({ type: 'enum', enum: NOTIFICATION_TYPE })
  type: NOTIFICATION_TYPE;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
