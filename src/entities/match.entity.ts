import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { MatchStatus } from '../common/enums/match-status.enum';
import { MatchAttendee } from './match-attendee.entity';

@Entity('match')
export class Match extends BaseEntity {
  @Column()
  location: string;

  @Column()
  location_url: string;

  @Column()
  user_id: number;

  @Column({ type: 'enum', enum: MatchStatus })
  status: MatchStatus;

  @Column()
  max_num_attendees: number;

  @Column()
  description: string;

  @Column()
  create_chat: boolean;

  @Column()
  start_datetime: Date;

  @Column()
  end_datetime: Date;

  @ManyToOne(() => User, (user) => user.matches)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => MatchAttendee, (attendee) => attendee.match)
  attendees: MatchAttendee[];
}
