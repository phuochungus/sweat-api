import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from 'src/common/enums';

export class PostMediaDto {
  @ApiProperty()
  priority!: number;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  type!: MediaType;
}
