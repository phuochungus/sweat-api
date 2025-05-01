import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { PostPrivacy } from 'src/common/enums';
import { ApiProperty } from '@nestjs/swagger';
import { PostMedia } from 'src/entities/post-media.entity';

@Entity('post')
export class Post extends BaseEntity {
  @ApiProperty()
  @Column()
  text!: string;

  @Column({ default: 0 })
  @ApiProperty()
  commentCount!: number;

  @Column({ default: 0 })
  @ApiProperty()
  reactCount!: number;

  @Column({ default: 0 })
  @ApiProperty()
  mediaCount!: number;

  @Column({ type: 'enum', enum: PostPrivacy })
  @ApiProperty({ enum: PostPrivacy })
  privacy!: PostPrivacy;

  @Column()
  @ApiProperty()
  userId!: number;

  @Column({ nullable: true })
  @ApiProperty()
  location?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty()
  @OneToMany(() => PostMedia, (postMedia) => postMedia.post, { cascade: true })
  postMedia: PostMedia[];
}
