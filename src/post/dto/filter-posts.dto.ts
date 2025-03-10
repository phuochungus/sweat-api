import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { GenericFilter } from 'src/common/generic/paginate';

export class FilterPostsDto extends GenericFilter {
  @ApiPropertyOptional({ description: "List posts on user's profile" })
  createdBy?: string;

  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @ApiPropertyOptional()
  isReel?: boolean;
}
