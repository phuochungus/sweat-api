import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenericFilter } from 'src/common/generic/paginate';

export class FilterPostsDto extends GenericFilter {
  @ApiPropertyOptional({ description: "List posts on user's profile" })
  createdBy?: string;

  @ApiProperty({ description: 'isReacted, isFeatPost' })
  includes?: string;

  @ApiPropertyOptional({ description: 'Search by post content' })
  query?: string;
}
