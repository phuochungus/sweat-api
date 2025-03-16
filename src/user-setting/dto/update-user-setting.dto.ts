import { OmitType, PartialType } from '@nestjs/swagger';
import { UserSetting } from 'src/entities';

export class UpdateUserSettingDto extends PartialType(
  OmitType(UserSetting, ['userId']),
) {}
