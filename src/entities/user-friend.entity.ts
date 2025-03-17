import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('user_friend')
export class UserFriend extends BaseEntity {
  @Column()
  userId1!: number;

  @Column()
  userId2!: number;
}
