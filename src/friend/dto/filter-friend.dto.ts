import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenericFilter } from 'src/common/generic/paginate';

export class FilterFriendsDto extends GenericFilter {
  @ApiPropertyOptional({ description: 'Search query' })
  query?: string;

  @ApiPropertyOptional({
    description: ['pendingRequest', 'mutualFriendsCount']
      .map((field) => field)
      .join(', '),
  })
  includes?: string;
}
