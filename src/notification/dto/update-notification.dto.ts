import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { NotificationStatus } from 'src/common/enums';

export class UpdateNotificationDto {
  @IsOptional()
  @ApiPropertyOptional({
    description: 'IDs of the notifications to update',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];

  @ApiProperty({
    description: 'New notification status',
    enum: NotificationStatus,
    example: NotificationStatus.READ,
  })
  @IsEnum(NotificationStatus)
  @IsNotEmpty()
  status: NotificationStatus;

  @ApiProperty({
    description: 'Flag to update all notifications',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  updateAll?: boolean;
}
