import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Post } from './post.entity';
import { PostTag } from './post-tag.entity';
import { PostComment } from './post-comment.entity';
import { PostReact } from './post-react.entity';
import { UserFriendRequest } from './user-friend-request.entity';
import { Match } from './match.entity';
import { UserGender } from 'src/common/enums';

@Entity('user')
export class User extends BaseEntity {
  @Column({ nullable: true })
  fullname?: string;

  @Column({ nullable: true })
  avatar_url?: string;

  @Column({ nullable: true })
  cover_url?: string;

  @Column({ nullable: true })
  bio?: string;

  @Column({ nullable: true })
  birthday?: Date;

  @Column({ type: 'enum', enum: UserGender, nullable: true })
  gender?: UserGender;

  @Column({ nullable: true })
  firebase_id?: string;
  
}
