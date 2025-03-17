import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserFriendRequestDto } from './dto/create-user-friend-request.dto';
import { UpdateUserFriendRequestDto } from './dto/update-user-friend-request.dto';
import { UserFriend, UserFriendRequest, UserNotification } from 'src/entities';
import { DataSource } from 'typeorm';
import { FriendRequestStatus, NotificationStatus } from 'src/common/enums';
import { FilterFriendRequestDto } from 'src/user-friend-request/dto/filter-friend-request.dto';
import { PageDto, PageMetaDto } from 'src/common/dto';
import { SOCIAL } from 'src/user-notification/enum';

@Injectable()
export class UserFriendRequestService {
  constructor(private readonly dataSource: DataSource) {}

  async create(
    createUserFriendRequestDto: CreateUserFriendRequestDto,
    { currentUserId },
  ) {
    const queryBuilder = this.dataSource.createQueryBuilder(
      UserFriendRequest,
      'ufr',
    );
    queryBuilder
      .insert()
      .values({
        senderUserId: currentUserId,
        receiverUserId: createUserFriendRequestDto.receiverUserId,
        status: FriendRequestStatus.PENDING,
      })
      .execute();

    //todo: send notification to receiver
  }

  async findAll(
    FilterFriendRequestDto: FilterFriendRequestDto,
    { currentUserId },
  ) {
    const { page, take, receiverUserId, senderUserId, status } =
      FilterFriendRequestDto;
    const queryBuilder = this.dataSource.createQueryBuilder(
      UserFriendRequest,
      'ufr',
    );
    if (receiverUserId) {
      queryBuilder.andWhere('ufr.receiverUserId = :receiverUserId', {
        receiverUserId,
      });
    }
    if (senderUserId) {
      queryBuilder.andWhere('ufr.senderUserId = :senderUserId', {
        senderUserId,
      });
    }

    if (status) {
      queryBuilder.andWhere('ufr.status = :status', { status });
    }

    const [item, itemCount] = await Promise.all([
      queryBuilder
        .skip((page - 1) * take)
        .take(take)
        .getMany(),
      queryBuilder.getCount(),
    ]);

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: { page, take },
    });
    return new PageDto(item, pageMetaDto);
  }

  findOne(id: number) {
    return `This action returns a #${id} userFriendRequest`;
  }

  async update(
    friendRequestId: number,
    updateUserFriendRequestDto: UpdateUserFriendRequestDto,
    { currentUserId },
  ) {
    const { status } = updateUserFriendRequestDto;
    const friendRequest = await this.dataSource
      .createQueryBuilder(UserFriendRequest, 'ufr')
      .where('ufr.id = :id', { id: friendRequestId })
      .getOne();

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    if (
      status != friendRequest.status &&
      friendRequest.receiverUserId !== currentUserId &&
      status != FriendRequestStatus.PENDING
    ) {
      throw new ForbiddenException(
        'You are not allowed to accept this request',
      );
    }

    await this.dataSource
      .createQueryBuilder(UserFriendRequest, 'ufr')
      .update()
      .set({ status })
      .where('id = :id', { id: friendRequestId })
      .execute();

    if (status === FriendRequestStatus.ACCEPTED) {
      await this.dataSource
        .createQueryBuilder(UserFriend, 'uf')
        .insert()
        .values([
          {
            userId1: friendRequest.senderUserId,
            userId2: friendRequest.receiverUserId,
          },
        ])
        .execute();

      await this.dataSource
        .createQueryBuilder(UserFriendRequest, 'ufr')
        .delete()
        .where('id = :id', { id: friendRequestId })
        .execute();

      await this.dataSource
        .createQueryBuilder(UserNotification, 'un')
        .insert()
        .values([
          {
            receiverUserId: friendRequest.senderUserId,
            text: 'Friend request accepted',
            status: NotificationStatus.UNREAD,
            type: SOCIAL.ACCEPT_FRIEND_REQUEST,
          },
        ])
        .execute();
    }
    if (status === FriendRequestStatus.REJECTED) {
      await this.dataSource
        .createQueryBuilder(UserFriendRequest, 'ufr')
        .delete()
        .where('id = :id', { id: friendRequestId })
        .execute();
    }
  }

  async remove(id: number) {
    await this.dataSource
      .createQueryBuilder(UserFriendRequest, 'ufr')
      .delete()
      .where('id = :id', { id })
      .execute();
  }
}
