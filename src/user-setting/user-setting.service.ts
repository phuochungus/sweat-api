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

  async findOne(userId: number) {
    let setting = await this.userSettingRepository.findOne({
      where: { userId },
    });
    if (!setting) {
      setting = this.userSettingRepository.create({ userId });
      this.userSettingRepository.save(setting);
      setting = await this.userSettingRepository.findOne({
        where: { userId },
      });
    }
    return setting;
  }

  async update(userId: number, updateUserSettingDto: UpdateUserSettingDto) {
    await this.userSettingRepository.update({ userId }, updateUserSettingDto);
    return this.userSettingRepository.findOne({
      where: { userId },
    });
  }
}
