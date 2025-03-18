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
import { FilterFriendsDto } from 'src/friend/dto/filter-friend.dto';
import { UserNotification } from 'src/entities';
import { FriendService } from 'src/friend/friend.service';
import { NotificationService } from 'src/notification/notification.service';

@Auth()
@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly friendService: FriendService,
    private readonly userNotificationService: NotificationService,
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
    return this.friendService.getFriends(filterDto, {
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
