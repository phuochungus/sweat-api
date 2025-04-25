import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeviceTokenDto {
  @ApiProperty({
    description: 'Firebase Cloud Messaging device token',
    example: 'eKJ82hDMQT-uSJJk5RzOaR:APA91bHfc8h5slR...',
  })
  @IsNotEmpty()
  @IsString()
  token: string;
}
