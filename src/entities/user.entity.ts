import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserGender } from 'src/common/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

@Entity('user')
export class User extends BaseEntity {
  @Column({ nullable: true })
  @ApiPropertyOptional()
  fullname?: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  @Transform(({ value }) =>
    value.replace(process.env.AWS_S3_PUBLIC_URL, process.env.AWS_S3_CDN_URL),
  )
  avatar_url?: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  @Transform(({ value }) =>
    value.replace(process.env.AWS_S3_PUBLIC_URL, process.env.AWS_S3_CDN_URL),
  )
  cover_url?: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  bio?: string;

  @Column({ nullable: true, type: 'time without time zone' })
  @ApiPropertyOptional()
  birthday?: Date;

  @Column({ type: 'enum', enum: UserGender, nullable: true })
  @ApiPropertyOptional()
  gender?: UserGender;

  @Column({ nullable: false })
  firebase_id!: string;

  @Column({ nullable: false, default: 0 })
  friend_count!: number;
}
