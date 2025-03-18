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
  avatarUrl?: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  @Transform(({ value }) =>
    value.replace(process.env.AWS_S3_PUBLIC_URL, process.env.AWS_S3_CDN_URL),
  )
  coverUrl?: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  bio?: string;

  @Column({ nullable: true, type: 'date' })
  @ApiPropertyOptional()
  birthday?: Date;

  @Column({ type: 'enum', enum: UserGender, nullable: true })
  @ApiPropertyOptional()
  gender?: UserGender;

  @Column({ nullable: true })
  firebaseId?: string;

  @Column({ nullable: false, default: 0 })
  friendCount!: number;

  @Column('simple-array', { nullable: true })
  deviceTokens?: string[];
}
