import { Controller, Get, Query } from '@nestjs/common';
import { UserFriendService } from './user-friend.service';
import { User } from 'src/common/decorators';
import { FilterFriendsDto } from 'src/user-friend/dto/filter-posts.dto';

@Controller('user-friend')
export class UserFriendController {
  constructor(private readonly userFriendService: UserFriendService) {}

  @Get('/')
  async getFriends(
    @User('uid') currentUserId: number,
    @Query() q: FilterFriendsDto,
  ) {
    return this.userFriendService.getFriends(q, { currentUserId });
  }
}
