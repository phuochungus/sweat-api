import { Controller } from '@nestjs/common';
import { UserNotificationService } from './user-notification.service';
import { Auth } from 'src/common/decorators';

@Auth()
@Controller('user-notification')
export class UserNotificationController {
  constructor(
    private readonly userNotificationService: UserNotificationService,
  ) {}
}
