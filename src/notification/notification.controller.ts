import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Auth, User } from 'src/common/decorators';
import { UpdateNotificationDto } from 'src/notification/dto/update-notification.dto';
import { FilterNotificationDto } from 'src/notification/dto/filter-notification.dto';

@Auth()
@Controller('user-notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Patch('/')
  async batchUpdate(
    @User('id') currentUserId: string,
    @Body() updateDto: UpdateNotificationDto,
  ) {
    return this.notificationService.batchUpdate(updateDto, {
      currentUserId,
    });
  }

  @Get('/')
  async getNotifications(
    @User('id') currentUserId: string,
    @Query() filterNotificationDto: FilterNotificationDto,
  ) {
    return this.notificationService.getAll(filterNotificationDto, {
      currentUserId,
    });
  }
}
