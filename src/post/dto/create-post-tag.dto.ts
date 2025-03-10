import { ApiProperty } from '@nestjs/swagger';

export class PostTagDto {
  @ApiProperty()
  user_id: number;
}
