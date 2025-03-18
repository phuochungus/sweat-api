import { PickType } from '@nestjs/swagger';
import { UserFriendRequest } from 'src/entities';

export class UpdateFriendRequestDto extends PickType(UserFriendRequest, [
  'status',
] as const) {}
