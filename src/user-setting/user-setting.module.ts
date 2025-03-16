import { Module } from '@nestjs/common';
import { UserSettingService } from './user-setting.service';
import { UserSettingController } from './user-setting.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserSetting } from 'src/entities';

@Module({
  imports: [TypeOrmModule.forFeature([UserSetting, User])],
  controllers: [UserSettingController],
  providers: [UserSettingService],
})
export class UserSettingModule {}
