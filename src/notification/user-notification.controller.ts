import { Body, Controller, Patch } from '@nestjs/common';
import { NotificationService } from './user-notification.service';
import { Auth, User } from 'src/common/decorators';
import { UpdateUserNotificationDto } from 'src/notification/dto/update-user-notification.dto';

@Auth()
@Controller('user-notification')
export class NotificationController {
  constructor(private readonly userNotificationService: NotificationService) {}

  @Patch('/')
  async batchUpdate(
    @User('id') currentUserId: string,
    @Body() updateDto: UpdateUserNotificationDto,
  ) {
    return this.userNotificationService.batchUpdate(updateDto, {
      currentUserId,
    });
  }
}
