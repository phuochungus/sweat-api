import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { EventParticipant } from './event-participant.entity';
import { EventMedia } from './event-media.entity';
import { EventComment } from './event-comment.entity';
import { EventPrivacy } from 'src/common/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

@Entity('event')
export class Event extends BaseEntity {
  @Column()
  @ApiProperty()
  title!: string;

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional()
  description?: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  location?: string;

  @Column({ type: 'timestamp with time zone' })
  @ApiProperty()
  startTime!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @ApiPropertyOptional()
  endTime?: Date;

  @Column()
  @ApiProperty()
  creatorId!: number;

  @Column({ type: 'enum', enum: EventPrivacy, default: EventPrivacy.PUBLIC })
  @ApiProperty({ enum: EventPrivacy })
  privacy!: EventPrivacy;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  @Transform(({ value }) =>
    value?.replace(process.env.AWS_S3_PUBLIC_URL, process.env.AWS_S3_CDN_URL),
  )
  coverImage?: string;

  @Column({ default: 0 })
  participantCount!: number;

  @Column({ default: 0 })
  commentCount!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @OneToMany(() => EventParticipant, (participant) => participant.event)
  participants: EventParticipant[];

  @OneToMany(() => EventMedia, (media) => media.event)
  media: EventMedia[];

  @OneToMany(() => EventComment, (comment) => comment.event)
  comments: EventComment[];
}
