import { ApiProperty } from '@nestjs/swagger';
import { GenericFilter } from 'src/common/generic/paginate';

export class FilterNotificationDto extends GenericFilter {
  @ApiProperty({ required: true })
  userId!: string;
}
