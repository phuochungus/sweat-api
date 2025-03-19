import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { React, User } from 'src/entities';

@Entity('post_comment')
export class PostComment extends BaseEntity {
  @Column()
  userId!: number;

  @Column()
  postId!: number;

  @Column()
  text!: string;

  @Column({ nullable: true })
  replyOf?: number;

  @ManyToOne(() => User)
  user: User;

  @Column({ nullable: true })
  parentCommentId?: number;

  @Column({ default: 0 })
  replyCount!: number;

  @Column({ default: 0 })
  reactCount!: number;

  @OneToMany(() => React, (react) => react.postComment)
  react: React[];
}
