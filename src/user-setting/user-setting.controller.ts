import { Controller, Get, Body, Patch } from '@nestjs/common';
import { UserSettingService } from './user-setting.service';
import { UpdateUserSettingDto } from './dto/update-user-setting.dto';
import { Auth, User } from 'src/common/decorators';

@Auth()
@Controller('user-setting')
export class UserSettingController {
  constructor(private readonly userSettingService: UserSettingService) {}

  @Get('/')
  findOne(@User('id') userId: number) {
    return this.userSettingService.findOne(userId);
  }

  @Patch('')
  update(
    @User('id') userId: number,
    @Body() updateUserSettingDto: UpdateUserSettingDto,
  ) {
    return this.userSettingService.update(userId, updateUserSettingDto);
  }
}
