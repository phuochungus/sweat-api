import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { PostPrivacy } from 'src/common/enums';
import { PostTag } from './post-tag.entity';

@Entity('post')
export class Post extends BaseEntity {
  @Column()
  text!: string;

  @Column({ default: 0 })
  commentCount!: number;

  @Column({ default: 0 })
  reactCount!: number;

  @Column({ default: 0 })
  mediaCount!: number;

  @Column({ type: 'enum', enum: PostPrivacy })
  privacy!: PostPrivacy;

  @Column()
  userId!: number;

  @Column({ nullable: true })
  location?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => PostTag, (postTag) => postTag.post, { cascade: true })
  tags: PostTag[];
}
