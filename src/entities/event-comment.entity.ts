import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Event } from './event.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('event_comment')
export class EventComment extends BaseEntity {
  @Column()
  @ApiProperty()
  eventId!: number;

  @Column()
  @ApiProperty()
  userId!: number;

  @Column()
  @ApiProperty()
  text!: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  replyCommentId?: number;

  @Column({ default: 0 })
  replyCount!: number;

  @Column({ default: 0 })
  reactCount!: number;

  @ManyToOne(() => Event, (event) => event.comments)
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => EventComment)
  @JoinColumn({ name: 'replyCommentId' })
  parentComment: EventComment;
}
