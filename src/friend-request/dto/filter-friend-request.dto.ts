import { ApiPropertyOptional } from '@nestjs/swagger';
import { FriendRequestStatus } from 'src/common/enums';
import { GenericFilter } from 'src/common/generic/paginate';

export class FilterFriendRequestDto extends GenericFilter {
  @ApiPropertyOptional()
  senderUserId?: number;

  @ApiPropertyOptional()
  receiverUserId?: number;

  @ApiPropertyOptional({ enum: FriendRequestStatus })
  status?: FriendRequestStatus;

  @ApiPropertyOptional()
  query?: string;

  @ApiPropertyOptional({ description: 'Include sender details' })
  withSender?: boolean;

  @ApiPropertyOptional({ description: 'Include sender mutual friends' })
  withSenderMutualFriends?: boolean;
}
