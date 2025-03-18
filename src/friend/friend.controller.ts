import { Controller, Delete, Param } from '@nestjs/common';
import { FriendService } from './friend.service';
import { User } from 'src/common/decorators';

@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Delete('/unfriend/:id')
  async unfriend(@User('id') currentUserId: string, @Param('id') id: string) {
    return this.friendService.unfriend(+id, { currentUserId });
  }
}
