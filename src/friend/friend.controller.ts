import { Controller, Delete, Get, Param } from '@nestjs/common';
import { FriendService } from './friend.service';
import { User } from 'src/common/decorators';

@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}
  @Get('/suggestions')
  async getFriendSuggestions(@User('id') currentUserId: string) {
    return this.friendService.getMutualFriends(2, 4);
  }

  @Get('/sync_friend')
  async syncFriend(@User('id') currentUserId: string) {
    return this.friendService.syncFriendCountForAllUser();
  }

  @Delete('/unfriend/:id')
  async unfriend(@User('id') currentUserId: string, @Param('id') id: string) {
    return this.friendService.unfriend(+id, { currentUserId });
  }
}
