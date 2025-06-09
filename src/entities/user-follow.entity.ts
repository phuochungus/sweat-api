import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('user_follow')
@Index(['userId', 'followerId'], { unique: true })
export class UserFollow extends BaseEntity {
  @Column({ nullable: false })
  @ApiProperty()
  userId!: number;

  @Column({ nullable: false })
  @ApiProperty()
  followerId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'followerId' })
  follower: User;
}
