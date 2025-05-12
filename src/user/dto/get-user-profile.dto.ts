import { ApiProperty } from '@nestjs/swagger';
import { UserGender } from 'src/common/enums';
import { Expose } from 'class-transformer';

export class GetUserProfileDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  fullname?: string;

  @ApiProperty()
  @Expose()
  avatarUrl?: string;

  @ApiProperty()
  @Expose()
  coverUrl?: string;

  @ApiProperty()
  @Expose()
  bio?: string;

  @ApiProperty()
  @Expose()
  birthday?: Date;

  @ApiProperty({ enum: UserGender })
  @Expose()
  gender?: UserGender;

  @ApiProperty()
  @Expose()
  friendCount: number;

  @ApiProperty()
  @Expose()
  isFriend?: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
