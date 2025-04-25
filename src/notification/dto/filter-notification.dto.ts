import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { GenericFilter } from 'src/common/generic/paginate';
import { NotificationStatus } from 'src/common/enums';

export class FilterNotificationDto extends GenericFilter {
  @ApiProperty({ required: true })
  userId!: string;

  @ApiPropertyOptional({
    description: 'Filter by notification status',
    enum: NotificationStatus,
    example: NotificationStatus.UNREAD
  })
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;
}
