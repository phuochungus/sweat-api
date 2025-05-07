import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { GenericFilter } from 'src/common/generic/paginate';

export class FilterFriendsDto extends GenericFilter {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: ['pendingRequest', 'mutualFriendsCount']
      .map((field) => field)
      .join(', '),
  })
  @IsOptional()
  @IsString()
  includes?: string;
}
