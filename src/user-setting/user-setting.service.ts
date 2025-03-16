import { Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNotEmpty } from 'class-validator';
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
