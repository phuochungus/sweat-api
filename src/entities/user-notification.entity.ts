import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { NotificationStatus } from 'src/common/enums/enum';
@Entity('user_notification')
export class UserNotification extends BaseEntity {
  @Column()
  receiver_id!: number;

  @Column()
  text!: string;

  @Column({ type: 'enum', enum: NotificationStatus })
  status!: NotificationStatus;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
