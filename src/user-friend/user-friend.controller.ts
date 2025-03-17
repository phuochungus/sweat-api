import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { UserFriendService } from './user-friend.service';
import { Auth, User } from 'src/common/decorators';
import { FilterFriendsDto } from 'src/user-friend/dto/filter-friend.dto';

@Auth()
@Controller('user-friend')
export class UserFriendController {
  constructor(private readonly userFriendService: UserFriendService) {}

  @Get('/suggestions')
  async getFriendSuggestions(@User('id') currentUserId: string) {
    return this.userFriendService.getMutualFriends(2, 4);
  }

  @Get('/sync_friend')
  async syncFriend(@User('id') currentUserId: string) {
    return this.userFriendService.syncFriendCountForAllUser();
  }

  @Delete('/unfriend/:id')
  async unfriend(@User('id') currentUserId: string, @Param('id') id: string) {
    return this.userFriendService.unfriend(+id, { currentUserId });
  }
}
