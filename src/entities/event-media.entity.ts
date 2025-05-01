import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Event } from './event.entity';
import { MediaType } from 'src/common/enums';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

@Entity('event_media')
export class EventMedia extends BaseEntity {
  @Column()
  @ApiProperty()
  eventId!: number;

  @Column()
  @ApiProperty()
  priority!: number;

  @Column()
  @ApiProperty()
  @Transform(({ value }) =>
    value.replace(process.env.AWS_S3_PUBLIC_URL, process.env.AWS_S3_CDN_URL),
  )
  url!: string;

  @Column({ type: 'enum', enum: MediaType })
  @ApiProperty({ enum: MediaType })
  type!: MediaType;

  @ManyToOne(() => Event, (event) => event.media)
  @JoinColumn({ name: 'eventId' })
  event: Event;
}
