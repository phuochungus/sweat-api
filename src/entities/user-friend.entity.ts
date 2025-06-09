import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('user_friend')
@Index(['userId1', 'userId2'], { unique: true })
export class UserFriend extends BaseEntity {
  @Column()
  userId1!: number;

  @Column()
  userId2!: number;
}
