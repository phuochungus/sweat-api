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
  avatar?: string;

  @Column({ type: 'enum', enum: UserGender, nullable: true })
  gender?: UserGender;

  @Column({ nullable: true })
  firebase_id?: string;

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => PostTag, (postTag) => postTag.user)
  postTags: PostTag[];

  @OneToMany(() => PostComment, (comment) => comment.user)
  comments: PostComment[];

  @OneToMany(() => PostReact, (react) => react.user)
  reacts: PostReact[];

  @OneToMany(() => UserFriendRequest, (request) => request.user)
  sentFriendRequests: UserFriendRequest[];

  @OneToMany(() => UserFriendRequest, (request) => request.targetUser)
  receivedFriendRequests: UserFriendRequest[];

  @OneToMany(() => Match, (match) => match.user)
  matches: Match[];
}
