import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Post } from './post.entity';
import { MediaType } from 'src/common/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

@Entity('post_media')
export class PostMedia extends BaseEntity {
  constructor(partial: Partial<PostMedia>) {
    super();
    Object.assign(this, partial);
  }
  @Column()
  postId!: number;

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

  @Column({ nullable: true })
  @ApiPropertyOptional()
  text?: string;

  @Column({ nullable: true })
  videoThumbnail?: string;

  @ManyToOne(() => Post)
  post: Post;
}
