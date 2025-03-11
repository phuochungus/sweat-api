import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserFriendService } from './user-friend.service';
import { CreateUserFriendDto } from './dto/create-user-friend.dto';
import { UpdateUserFriendDto } from './dto/update-user-friend.dto';
import { User } from 'src/common/decorators';

@Controller('user-friend')
export class UserFriendController {
  constructor(private readonly userFriendService: UserFriendService) {}

  @Post()
  create(@Body() createUserFriendDto: CreateUserFriendDto) {
    return this.userFriendService.create(createUserFriendDto);
  }

  @Get('/user/:userId')
  async getUserFriends(
    @User('uid') currentUserId: number,
    @Param('userId') userId: number,
  ) {
    return this.userFriendService.getUserFriends({ userId }, { currentUserId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userFriendService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserFriendDto: UpdateUserFriendDto,
  ) {
    return this.userFriendService.update(+id, updateUserFriendDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userFriendService.remove(+id);
  }
}
