import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateEventCommentDto {
  @ApiProperty({
    description: 'The updated text content of the comment',
    example: 'Updated comment text',
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}
