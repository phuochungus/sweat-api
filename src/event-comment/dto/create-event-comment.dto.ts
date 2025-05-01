import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEventCommentDto {
  @ApiProperty({
    description: 'The ID of the event to comment on',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  eventId: number;

  @ApiProperty({
    description: 'The text content of the comment',
    example: 'I am looking forward to this event!',
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
