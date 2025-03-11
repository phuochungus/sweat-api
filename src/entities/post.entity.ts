import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { PostPrivacy } from 'src/common/enums';
import { PostTag } from './post-tag.entity';
import { PostMedia } from './post-media.entity';
import { PostComment } from './post-comment.entity';
import { PostReact } from './post-react.entity';

@Entity('post')
export class Post extends BaseEntity {
  @Column()
  text!: string;

  @Column({ default: 0 })
  comment_count!: number;

  @Column({ default: 0 })
  react_count!: number;

  @Column({ default: 0 })
  media_count!: number;

  @Column({ type: 'enum', enum: PostPrivacy })
  privacy!: PostPrivacy;

  @Column()
  user_id!: number;

  @Column({ nullable: true })
  location?: string;

  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => PostTag, (postTag) => postTag.post, { cascade: true })
  tags: PostTag[];
}
