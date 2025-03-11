import { BaseEntity } from 'src/entities/base.entity';
import { Entity, Column, ManyToOne } from 'typeorm';

@Entity({ name: 'views_tracking' })
export class ViewsTracking extends BaseEntity {
  constructor(partial: Partial<ViewsTracking>) {
    super();
    Object.assign(this, partial);
  }

  @Column()
  postId!: string;

  @Column()
  userId!: string;

  @Column({ type: 'timestamp without time zone', nullable: true })
  viewedAt?: Date;
}
