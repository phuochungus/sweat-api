import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserFriendRequestDto } from './dto/create-user-friend-request.dto';
import { UpdateUserFriendRequestDto } from './dto/update-user-friend-request.dto';
import {
  User,
  UserFriend,
  UserFriendRequest,
  UserNotification,
} from 'src/entities';
import { DataSource } from 'typeorm';
import { FriendRequestStatus, NotificationStatus } from 'src/common/enums';
import { PageDto, PageMetaDto } from 'src/common/dto';
import { FriendService } from 'src/friend/friend.service';
import { TEMPLATE } from 'src/notification/template';
import { SOCIAL } from 'src/notification/enum';
import { FilterFriendRequestDto } from 'src/friend-request/dto/filter-friend-request.dto';

@Injectable()
export class FriendRequestService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly friendService: FriendService,
  ) {}

  async create(
    createUserFriendRequestDto: CreateUserFriendRequestDto,
    { currentUserId },
  ) {
    const currentUser = await this.dataSource
      .createQueryBuilder(User, 'u')
      .where('u.id = :id', { id: currentUserId })
      .getOne();

    const areFriends = await this.friendService.areFriends(
      currentUserId,
      createUserFriendRequestDto.receiverUserId,
    );
    if (areFriends) {
      throw new ForbiddenException('Already friends');
    }
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

    await this.dataSource
      .createQueryBuilder(UserNotification, 'un')
      .insert()
      .values([
        {
          receiverUserId: createUserFriendRequestDto.receiverUserId,
          senderUserId: currentUserId,
          text: TEMPLATE.CREATE_FRIEND_REQUEST.replace(
            '<name>',
            currentUser.fullname,
          ),
          status: NotificationStatus.UNREAD,
          type: SOCIAL.CREATE_FRIEND_REQUEST,
        },
      ])
      .execute();
  }

  async findAll(
    FilterFriendRequestDto: FilterFriendRequestDto,
    { currentUserId },
  ) {
    const {
      page,
      take,
      receiverUserId,
      senderUserId,
      status,
      withSender,
      query,
      withSenderMutualFriends,
    } = FilterFriendRequestDto;
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

    if (withSender) {
      queryBuilder.leftJoinAndSelect('ufr.senderUser', 'sender');
    }

    if (query) {
      queryBuilder.andWhere('sender.fullname LIKE :query', {
        query: `%${query}%`,
      });
    }

    let [item, itemCount] = await Promise.all([
      queryBuilder
        .skip((page - 1) * take)
        .take(take)
        .getMany(),
      queryBuilder.getCount(),
    ]);

    if (withSenderMutualFriends) {
      item = await Promise.all(
        item.map(async (request) => {
          const mutualFriends = await this.friendService.getMutualFriends(
            request.senderUserId,
            request.receiverUserId,
          );
          return { ...request, mutualFriends };
        }),
      );
    }

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: { page, take },
    });

    return new PageDto(item, pageMetaDto);
  }

  findOne(id: number) {
    return this.dataSource
      .createQueryBuilder(UserFriendRequest, 'ufr')
      .where('ufr.id = :id', { id })
      .getOne();
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

    if (friendRequest.receiverUserId !== currentUserId) {
      throw new ForbiddenException(
        'You are not allowed to update this request',
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

      await this.dataSource
        .createQueryBuilder(User, 'u')
        .update()
        .set({
          friendCount: () => 'friendCount + 1',
        })
        .where('id IN (:ids)', {
          ids: [friendRequest.senderUserId, friendRequest.receiverUserId],
        })
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
