import { ApiProperty } from '@nestjs/swagger';
import { Country } from 'src/common/enums';
import { User } from 'src/entities';
import { BaseEntity } from 'src/entities/base.entity';
import { Column, Entity, OneToOne } from 'typeorm';

@Entity('user_setting')
export class UserSetting extends BaseEntity {
  @Column({ nullable: false })
  userId!: number;

  @ApiProperty({
    enum: Country,
    default: Country.Vietnam,
    description: `https://gist.github.com/kyranjamie/646386d5edc174e8b549111572897f81?permalink_comment_id=4321789#gistcomment-4321789`,
  })
  @Column({ type: 'enum', enum: Country, default: Country.Vietnam })
  language!: Country;

  @ApiProperty({ default: true })
  @Column({ default: true })
  notification!: boolean;

  @OneToOne(() => User)
  user: User;
}
