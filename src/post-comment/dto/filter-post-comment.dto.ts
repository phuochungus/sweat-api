import { ApiPropertyOptional } from '@nestjs/swagger';
import { GenericFilter } from 'src/common/generic/paginate';

export class FilterPostCommentDto extends GenericFilter {
  @ApiPropertyOptional({ description: 'postId' })
  postId?: number;

  @ApiPropertyOptional({ description: 'replyCommentId' })
  replyCommentId?: number;

  @ApiPropertyOptional({ description: 'isReacted' })
  includes?: string;
}
