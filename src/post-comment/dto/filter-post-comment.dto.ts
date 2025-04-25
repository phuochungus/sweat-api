import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { GenericFilter } from 'src/common/generic/paginate';

export class FilterPostCommentDto extends GenericFilter {
  @ApiPropertyOptional({
    description: 'ID of the post to get comments for',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  postId?: number;

  @ApiPropertyOptional({
    description:
      'ID of the parent comment to get replies for. Use "null" to get top-level comments only',
    example: 5,
  })
  @IsNumber()
  @IsOptional()
  replyCommentId?: number;

  @ApiPropertyOptional({
    description:
      'Optional includes, e.g. "isReacted" to check if the current user reacted to comments',
    example: 'isReacted',
  })
  @IsString()
  @IsOptional()
  includes?: string;
}
