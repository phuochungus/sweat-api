import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Post } from './post.entity';
import { MediaType } from 'src/common/enums';

@Entity('post_media')
export class PostMedia extends BaseEntity {
  @Column()
  post_id!: number;

  @Column()
  priority!: number;

  @Column()
  url!: string;

  @Column({ type: 'enum', enum: MediaType })
  type!: MediaType;

  @Column({ nullable: true })
  text?: string;

  @ManyToOne(() => Post, (post) => post.media)
  @JoinColumn({ name: 'post_id' })
  post: Post;
}
