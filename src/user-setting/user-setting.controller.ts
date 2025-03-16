import { Controller, Get, Body, Patch, Param, Query } from '@nestjs/common';
import { UserSettingService } from './user-setting.service';
import { UpdateUserSettingDto } from './dto/update-user-setting.dto';
import { Auth, User } from 'src/common/decorators';

@Auth()
@Controller('user-setting')
export class UserSettingController {
  constructor(private readonly userSettingService: UserSettingService) {}

  @Get('/')
  findOne(@User() userId: number) {
    return this.userSettingService.findOne(userId);
  }

  @Patch('')
  update(
    @User() userId: number,
    @Body() updateUserSettingDto: UpdateUserSettingDto,
  ) {
    return this.userSettingService.update(userId, updateUserSettingDto);
  }
}
