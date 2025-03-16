import { PickType } from '@nestjs/swagger';
import { UserFriendRequest } from 'src/entities';

export class CreateUserFriendRequestDto extends PickType(UserFriendRequest, [
  'receiverUserId',
] as const) {}
