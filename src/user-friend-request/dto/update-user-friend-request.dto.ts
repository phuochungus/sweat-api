import { PickType } from '@nestjs/swagger';
import { UserFriendRequest } from 'src/entities';

export class UpdateUserFriendRequestDto extends PickType(UserFriendRequest, [
  'status',
] as const) {}
