import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from 'src/common/enums';

export class CreatePostMediaDto {
  @ApiProperty()
  post_id!: number;

  @ApiProperty()
  priority!: number;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  type!: MediaType;
}
