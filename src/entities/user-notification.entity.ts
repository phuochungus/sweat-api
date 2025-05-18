import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { NotificationStatus } from 'src/common/enums';
import { Post } from 'src/entities/post.entity';
import { SOCIAL } from 'src/notification/enum';
@Entity('user_notification')
export class UserNotification extends BaseEntity {
  @Column()
  receiverUserId!: number;

  @Column({ nullable: true })
  senderUserId?: number;

  @Column({ nullable: true })
  postId?: number;

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
  @JoinColumn({ name: 'receiverUserId' }) // Fixed: Changed from user_id to receiverUserId
  user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderUserId' })
  senderUser: User;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;
}
