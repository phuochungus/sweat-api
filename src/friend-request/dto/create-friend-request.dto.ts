import { PickType } from '@nestjs/swagger';
import { UserFriendRequest } from 'src/entities';

export class CreateFriendRequestDto extends PickType(UserFriendRequest, [
  'receiverUserId',
] as const) {}
