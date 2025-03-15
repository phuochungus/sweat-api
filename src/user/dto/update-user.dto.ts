import { PartialType, PickType } from '@nestjs/swagger';
import { User } from 'src/entities';

export class UpdateUserDto extends PartialType(
  PickType(User, [
    'fullname',
    'avatar_url',
    'cover_url',
    'bio',
    'birthday',
    'gender',
  ] as const),
) {}
