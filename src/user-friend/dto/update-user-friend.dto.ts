import { PartialType } from '@nestjs/swagger';
import { CreateUserFriendDto } from './create-user-friend.dto';

export class UpdateUserFriendDto extends PartialType(CreateUserFriendDto) {}
