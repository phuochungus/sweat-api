import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePostCommentDto {
  @ApiProperty({
    description: 'The updated text content of the comment',
    example: 'This is my updated comment!',
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}
