import { ApiProperty } from '@nestjs/swagger';

export class CreatePostMediaDto {
  @ApiProperty()
  post_id!: number;

  @ApiProperty()
  priority!: number;

  @ApiProperty()
  url!: string;
}
