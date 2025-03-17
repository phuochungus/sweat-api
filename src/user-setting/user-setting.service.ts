import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSetting } from 'src/entities';
import { UpdateUserSettingDto } from 'src/user-setting/dto/update-user-setting.dto';
import { Repository } from 'typeorm';

@Injectable()
export class UserSettingService {
  constructor(
    @InjectRepository(UserSetting)
    private readonly userSettingRepository: Repository<UserSetting>,
  ) {}

  findOne(userId: number) {
    return this.userSettingRepository.findOne({ where: { userId } });
  }

  update(userId: number, updateUserSettingDto: UpdateUserSettingDto) {
    return this.userSettingRepository.update({ userId }, updateUserSettingDto);
  }
}
