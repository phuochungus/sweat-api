import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenericFilter } from 'src/common/generic/paginate';

export class FilterFriendsDto extends GenericFilter {
  @ApiProperty({ description: 'User ID to view friend' })
  userId!: number;

  @ApiPropertyOptional({ description: 'Search query' })
  query?: string;

  @ApiPropertyOptional()
  withCommonFriendsCount?: boolean;
}
