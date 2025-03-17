import { PartialType, PickType } from '@nestjs/swagger';
import { User } from 'src/entities';

export class UpdateUserDto extends PartialType(
  PickType(User, [
    'fullname',
    'avatarUrl',
    'coverUrl',
    'bio',
    'birthday',
    'gender',
    'firebaseId',
  ] as const),
) {}
