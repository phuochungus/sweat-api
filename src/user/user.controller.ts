import {
  Controller,
  Body,
  Patch,
  UseGuards,
  BadRequestException,
  Get,
  Param,
  Query,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGuard } from 'src/common/guards';
import { Auth, User } from 'src/common/decorators';
import { FilterFriendsDto } from 'src/friend/dto/filter-friend.dto';
import { FriendService } from 'src/friend/friend.service';

@Auth()
@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly friendService: FriendService,
  ) {}

  @Patch('/:id/profile')
  async updateUserProfile(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    if (!id) {
      throw new BadRequestException('Id is required');
    }
    if (isNaN(+id)) {
      throw new BadRequestException('Id must be a number');
    }
    return this.userService.update(+id, updateUserDto);
  }

  @Get('/login')
  async getUser(@User() user) {
    return user;
  }

  @Get('/:id/friends')
  async getFriends(
    @User('id') currentUserId: string,
    @Param('id') userId: string,
    @Query() filterDto: FilterFriendsDto,
  ) {
    return this.friendService.getFriends(filterDto, {
      currentUserId,
      userId,
    });
  }

  @Delete('/:id/friend')
  async unfriend(
    @User('id') currentUserId: string,
    @Param('id') userId: string,
  ) {
    return this.friendService.unfriend({
      currentUserId,
      userId,
    });
  }

  @Get('/:id/friend-suggestion')
  async getFriendSuggestions(@Param('id') userId: string) {
    if (!userId) {
      throw new BadRequestException('User Id is required');
    }
    if (isNaN(+userId)) {
      throw new BadRequestException('User Id must be a number');
    }
    return this.friendService.getSuggestions({ userId: +userId });
  }
}
