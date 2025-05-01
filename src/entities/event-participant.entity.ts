import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Event } from './event.entity';
import { ParticipantStatus } from 'src/common/enums';
import { ApiProperty } from '@nestjs/swagger';

@Entity('event_participant')
export class EventParticipant extends BaseEntity {
  @Column()
  @ApiProperty()
  eventId!: number;

  @Column()
  @ApiProperty()
  userId!: number;

  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.GOING,
  })
  @ApiProperty({ enum: ParticipantStatus })
  status!: ParticipantStatus;

  @ManyToOne(() => Event, (event) => event.participants)
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
