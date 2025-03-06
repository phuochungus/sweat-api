import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { PostPrivacy } from 'src/common/enums/enum';
import { PostTag } from './post-tag.entity';
import { PostMedia } from './post-media.entity';
import { PostComment } from './post-comment.entity';
import { PostReact } from './post-react.entity';

@Entity('post')
export class Post extends BaseEntity {
  @Column()
  text: string;

  @Column()
  comment_count: number;

  @Column()
  react_count: number;

  @Column()
  media_count: number;

  @Column({ type: 'enum', enum: PostPrivacy })
  privacy: PostPrivacy;

  @Column()
  user_id: number;

  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => PostTag, (postTag) => postTag.post)
  tags: PostTag[];

  @OneToMany(() => PostMedia, (media) => media.post)
  media: PostMedia[];

  @OneToMany(() => PostComment, (comment) => comment.post)
  comments: PostComment[];

  @OneToMany(() => PostReact, (react) => react.post)
  reacts: PostReact[];
}
