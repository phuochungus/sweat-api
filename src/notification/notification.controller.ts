import { Body, Controller, Patch } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Auth, User } from 'src/common/decorators';
import { UpdateNotificationDto } from 'src/notification/dto/update-notification.dto';

@Auth()
@Controller('user-notification')
export class NotificationController {
  constructor(private readonly userNotificationService: NotificationService) {}

  @Patch('/')
  async batchUpdate(
    @User('id') currentUserId: string,
    @Body() updateDto: UpdateNotificationDto,
  ) {
    return this.userNotificationService.batchUpdate(updateDto, {
      currentUserId,
    });
  }
}
