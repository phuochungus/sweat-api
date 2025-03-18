import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationStatus } from 'src/common/enums';

export class UpdateUserNotificationDto {
  @ApiPropertyOptional({ description: 'Read status', enum: NotificationStatus })
  status: NotificationStatus;

  @ApiProperty()
  ids: number[];
}
