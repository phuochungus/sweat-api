import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Match } from './match.entity';
import { BaseEntity } from './base.entity';

@Entity('match_attendee')
export class MatchAttendee extends BaseEntity {
  @Column()
  match_id!: number;

  @Column()
  user_id!: number;

  @ManyToOne(() => Match, (match) => match.attendees)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
