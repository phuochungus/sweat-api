import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Post } from './post.entity';
import { PostTag } from './post-tag.entity';
import { PostComment } from './post-comment.entity';
import { PostReact } from './post-react.entity';
import { UserFriendRequest } from './user-friend-request.entity';
import { UserFriend } from './user-friend.entity';
import { UserNotification } from './user-notification.entity';
import { Match } from './match.entity';
import { MatchAttendee } from './match-attendee.entity';

@Entity('user')
export class User extends BaseEntity {
  @Column()
  fullname: string;

  @Column()
  avatar: string;

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
