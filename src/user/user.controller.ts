import {
  Controller,
  Body,
  Patch,
  UseGuards,
  BadRequestException,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGuard } from 'src/common/guards';
import { Auth, User } from 'src/common/decorators';
import { UserFriendService } from 'src/user-friend/user-friend.service';
import { FilterFriendRequestDto } from 'src/user-friend-request/dto/filter-friend-request.dto';
import { FilterFriendsDto } from 'src/user-friend/dto/filter-friend.dto';
import { UserNotification } from 'src/entities';
import { UserNotificationService } from 'src/user-notification/user-notification.service';

@Auth()
@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userFriendService: UserFriendService,
    private readonly userNotificationService: UserNotificationService,
  ) {}

  @Patch('/')
  async updateUser(
    @User('id') id: string,
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
    return this.userFriendService.getFriends(filterDto, {
      currentUserId,
      userId,
    });
  }

  // @Get('/:id/notification')
  // async getNotifications(
  //   @User('id') currentUserId: string,
  //   @Param('id') userId: string,
  // ) {
  //   return this.userNotificationService.batchUpdate
  // }
}
