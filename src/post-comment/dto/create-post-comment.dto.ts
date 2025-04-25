import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePostCommentDto {
  @ApiProperty({
    description: 'The ID of the post to comment on',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  postId: number;

  @ApiProperty({
    description: 'The text content of the comment',
    example: 'This is a great post!',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    description: 'The ID of the parent comment if this is a reply',
    example: 5,
  })
  @IsNumber()
  @IsOptional()
  replyCommentId?: number;
}
