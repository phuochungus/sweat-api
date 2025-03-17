import { Body, Controller, Patch } from '@nestjs/common';
import { UserNotificationService } from './user-notification.service';
import { Auth, User } from 'src/common/decorators';
import { UpdateUserNotificationDto } from 'src/user-notification/dto/update-user-notification.dto';

@Auth()
@Controller('user-notification')
export class UserNotificationController {
  constructor(
    private readonly userNotificationService: UserNotificationService,
  ) {}

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
