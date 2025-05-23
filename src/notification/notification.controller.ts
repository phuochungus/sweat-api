import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Delete,
  Param,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Auth, User } from 'src/common/decorators';
import { UpdateNotificationDto } from 'src/notification/dto/update-notification.dto';
import { FilterNotificationDto } from 'src/notification/dto/filter-notification.dto';
import { PushNotificationService } from './push-notification.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeviceTokenDto } from 'src/notification/dto';

@Auth()
@ApiTags('notifications')
@Controller('user-notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Patch('/')
  @ApiOperation({ summary: 'Update notification status' })
  @ApiResponse({
    status: 200,
    description: 'Notification status updated successfully',
  })
  async batchUpdate(
    @User('id') currentUserId: string,
    @Body() updateDto: UpdateNotificationDto,
  ) {
    return this.notificationService.batchUpdate(updateDto, {
      currentUserId,
    });
  }

  @Get('/')
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated user notifications',
  })
  async getNotifications(
    @User('id') currentUserId: string,
    @Query() filterNotificationDto: FilterNotificationDto,
  ) {
    return this.notificationService.getAll(filterNotificationDto, {
      currentUserId,
    });
  }

  @Post('/device-token')
  @ApiOperation({ summary: 'Register a device token for push notifications' })
  @ApiResponse({
    status: 201,
    description: 'Device token registered successfully',
  })
  async registerDeviceToken(
    @User('id') userId: number,
    @Body() deviceTokenDto: DeviceTokenDto,
  ) {
    await this.pushNotificationService.registerDeviceToken(
      userId,
      deviceTokenDto.token,
    );
    return { success: true, message: 'Device token registered successfully' };
  }

  @Delete('/device-token')
  @ApiOperation({ summary: 'Unregister a device token' })
  @ApiResponse({
    status: 200,
    description: 'Device token unregistered successfully',
  })
  async unregisterDeviceToken(
    @User('id') userId: number,
    @Body() deviceTokenDto: DeviceTokenDto,
  ) {
    await this.pushNotificationService.unregisterDeviceToken(
      userId,
      deviceTokenDto.token,
    );
    return { success: true, message: 'Device token unregistered successfully' };
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  async deleteNotification(
    @User('id') currentUserId: string,
    @Param('id') notificationId: number,
  ) {
    return this.notificationService.deleteNotification(+notificationId, {
      currentUserId,
    });
  }
}
