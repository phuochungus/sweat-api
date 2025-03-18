import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { FriendRequestService } from './friend-request.service';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { UpdateFriendRequestDto } from './dto/update-friend-request.dto';
import { Auth, User } from 'src/common/decorators';
import { FilterFriendRequestDto } from 'src/friend-request/dto/filter-friend-request.dto';

@Auth()
@Controller('friend-request')
export class FriendRequestController {
  constructor(
    private readonly userFriendRequestService: FriendRequestService,
  ) {}

  @Post()
  create(
    @Body() createUserFriendRequestDto: CreateFriendRequestDto,
    @User('id') user,
  ) {
    return this.userFriendRequestService.create(createUserFriendRequestDto, {
      currentUserId: user,
    });
  }

  @Get()
  findAll(
    @Query() filterRequestDto: FilterFriendRequestDto,
    @User('id') userId,
  ) {
    return this.userFriendRequestService.findAll(filterRequestDto, {
      currentUserId: userId,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userFriendRequestService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserFriendRequestDto: UpdateFriendRequestDto,
    @User('id') user,
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
