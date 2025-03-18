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
import { NotificationService } from 'src/notification/notification.service';
import { GenericFilter } from 'src/common/generic/paginate';

@Auth()
@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly friendService: FriendService,
    private readonly notificationService: NotificationService,
  ) {}

  @Patch('/:id')
  async updateUser(
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

  @Get('/:id/friend')
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
  async getFriendSuggestions(@Param('id') currentUserId: string) {
    return this.friendService.getSuggestions({ userId: currentUserId });
  }

  @Get('/:id/notification')
  async getNotifications(
    @Param('id') userId: string,
    @Query() filterNotiDto: GenericFilter,
  ) {
    return this.notificationService.getAll(filterNotiDto, { userId });
  }
}
