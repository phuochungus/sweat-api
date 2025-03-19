import { PickType } from '@nestjs/swagger';
import { UserFriendRequest } from 'src/entities';

export class CreateFriendRequestDto extends PickType(UserFriendRequest, [
  'senderUserId',
  'receiverUserId',
] as const) {}
