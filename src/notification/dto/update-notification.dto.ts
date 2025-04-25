import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { NotificationStatus } from 'src/common/enums';

export class UpdateNotificationDto {
  @ApiProperty({
    description: 'IDs of the notifications to update',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  ids: number[];

  @ApiProperty({
    description: 'New notification status',
    enum: NotificationStatus,
    example: NotificationStatus.READ,
  })
  @IsEnum(NotificationStatus)
  @IsNotEmpty()
  status: NotificationStatus;
}
