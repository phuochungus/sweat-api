import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('user_friend')
export class UserFriend extends BaseEntity {
  @Column()
  user_id1!: number;

  @Column()
  user_id2!: number;
}
