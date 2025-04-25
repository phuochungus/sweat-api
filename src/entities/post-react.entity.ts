import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { ReactType } from 'src/common/enums';
import { Post } from './post.entity';
import { PostComment } from './post-comment.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('post_react')
export class PostReact extends BaseEntity {
  @ApiProperty({ enum: ReactType })
  @Column({ type: 'enum', enum: ReactType })
  type!: ReactType;

  @ApiProperty()
  @Column()
  userId!: number;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  commentId?: number;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  postId?: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Post, { nullable: true })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @ManyToOne(() => PostComment, { nullable: true })
  @JoinColumn({ name: 'commentId' })
  postComment: PostComment;
}
