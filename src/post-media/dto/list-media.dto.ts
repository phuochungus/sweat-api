import { ApiPropertyOptional } from '@nestjs/swagger';
import { TYPE_UPLOAD } from 'src/common/enums';
import { GenericFilter } from 'src/common/generic/paginate';

export class FilterMediaDto extends GenericFilter {
  @ApiPropertyOptional({
    description: `${Object.keys(TYPE_UPLOAD)
      .map((e) => `${e}: ${TYPE_UPLOAD[e]}`)
      .join(' - ')}`,
    example: TYPE_UPLOAD.IMAGE,
  })
  mimeType?: string;
}
