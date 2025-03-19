import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Post, React, User } from 'src/entities';
import { ApiProperty } from '@nestjs/swagger';

@Entity('post_comment')
export class PostComment extends BaseEntity {
  @Column()
  userId!: number;

  @ApiProperty()
  @Column()
  postId!: number;

  @ApiProperty()
  @Column()
  text!: string;

  @ApiProperty()
  @Column({ nullable: true })
  replyCommentId?: number;

  @ManyToOne(() => User)
  user: User;

  @Column({ default: 0 })
  replyCount!: number;

  @Column({ default: 0 })
  reactCount!: number;

  @OneToMany(() => React, (react) => react.postComment)
  react: React[];

  @OneToMany(() => PostComment, (comment) => comment.replyCommentId)
  @JoinColumn({ name: 'replyCommentId' })
  replies: PostComment[];

  @ManyToOne(() => Post)
  @JoinColumn({ name: 'postId' })
  post: Post;
}
