import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserFriendRequestService } from './user-friend-request.service';
import { CreateUserFriendRequestDto } from './dto/create-user-friend-request.dto';
import { UpdateUserFriendRequestDto } from './dto/update-user-friend-request.dto';
import { Auth, User } from 'src/common/decorators';

@Auth()
@Controller('user-friend-request')
export class UserFriendRequestController {
  constructor(
    private readonly userFriendRequestService: UserFriendRequestService,
  ) {}

  @Post()
  create(
    @Body() createUserFriendRequestDto: CreateUserFriendRequestDto,
    @User('id') user,
  ) {
    return this.userFriendRequestService.create(createUserFriendRequestDto, {
      currentUserId: user,
    });
  }

  @Get()
  findAll() {
    return this.userFriendRequestService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userFriendRequestService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserFriendRequestDto: UpdateUserFriendRequestDto,
    @User() user,
  ) {
    return this.userFriendRequestService.update(
      +id,
      updateUserFriendRequestDto,
      {
        currentUserId: user,
      },
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userFriendRequestService.remove(+id);
  }
}
