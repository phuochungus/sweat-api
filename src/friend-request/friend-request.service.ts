import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { UpdateFriendRequestDto } from './dto/update-friend-request.dto';
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
    createUserFriendRequestDto: CreateFriendRequestDto,
    { currentUserId },
  ) {
    const { receiverUserId, senderUserId } = createUserFriendRequestDto;

    if (receiverUserId === senderUserId) {
      throw new ForbiddenException(
        'You cannot send friend request to yourself',
      );
    }

    if (currentUserId !== senderUserId) {
      throw new ForbiddenException('You are not allowed to send this request');
    }

    const senderUser = await this.dataSource
      .createQueryBuilder(User, 'u')
      .where('u.id = :id', { id: senderUserId })
      .andWhere('u.deletedAt IS NULL') // Ensure sender is not deleted
      .getOne();

    if (!senderUser) {
      throw new NotFoundException('Sender user not found');
    }

    const receiverUser = await this.dataSource
      .createQueryBuilder(User, 'u')
      .where('u.id = :id', { id: receiverUserId })
      .andWhere('u.deletedAt IS NULL') // Ensure receiver is not deleted
      .getOne();

    if (!receiverUser) {
      throw new NotFoundException('Receiver user not found');
    }

    // Check if already friends
    const areFriends = await this.friendService.areFriends(
      senderUserId,
      receiverUserId,
    );

    if (areFriends) {
      throw new ForbiddenException('Already friends');
    }

    // Check for existing friend request
    const existingRequest = await this.dataSource
      .createQueryBuilder(UserFriendRequest, 'ufr')
      .where(
        '(ufr.senderUserId = :senderUserId AND ufr.receiverUserId = :receiverUserId) OR (ufr.senderUserId = :receiverUserId AND ufr.receiverUserId = :senderUserId)',
        {
          senderUserId,
          receiverUserId,
        },
      )
      .getOne();

    if (existingRequest) {
      throw new ForbiddenException('Friend request already exists');
    }

    // Create the friend request
    const result = await this.dataSource
      .createQueryBuilder(UserFriendRequest, 'ufr')
      .insert()
      .values({
        senderUserId,
        receiverUserId,
        status: FriendRequestStatus.PENDING,
      })
      .execute();

    const friendRequest = await this.findOne(result.identifiers[0].id);

    // Create notification
    await this.dataSource
      .createQueryBuilder(UserNotification, 'un')
      .insert()
      .values([
        {
          receiverUserId,
          senderUserId,
          text: TEMPLATE.CREATE_FRIEND_REQUEST.replace(
            '<n>',
            senderUser.fullname,
          ),
          status: NotificationStatus.UNREAD,
          type: SOCIAL.CREATE_FRIEND_REQUEST,
          data: JSON.parse(
            JSON.stringify({
              id: friendRequest.id,
            }),
          ),
        },
      ])
      .execute();

    // Return the created friend request object
    return {
      id: result.identifiers[0].id,
      senderUserId,
      receiverUserId,
      status: FriendRequestStatus.PENDING,
      createdAt: new Date(),
    };
  }

  async findAll(
    FilterFriendRequestDto: FilterFriendRequestDto,
    { currentUserId },
  ) {
    const {
      page = 1,
      take = 10,
      receiverUserId,
      senderUserId,
      status,
      withSender,
      query,
      withSenderMutualFriends,
    } = FilterFriendRequestDto;

    // Ensure page and take are numbers
    const pageNum = Number(page);
    const takeNum = Number(take);

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

    const skip = (pageNum - 1) * takeNum;

    let [item, itemCount] = await Promise.all([
      queryBuilder.skip(skip).take(takeNum).getMany(),
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
      pageOptionsDto: { page: pageNum, take: takeNum },
    });

    return new PageDto(item, pageMetaDto);
  }

  async findOne(id: number) {
    const friendRequest = await this.dataSource
      .createQueryBuilder(UserFriendRequest, 'ufr')
      .where('ufr.id = :id', { id })
      .getOne();

    if (!friendRequest) {
      throw new NotFoundException(`Friend request with ID ${id} not found`);
    }

    return friendRequest;
  }

  async update(
    friendRequestId: number,
    updateUserFriendRequestDto: UpdateFriendRequestDto,
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

    const [currentUser, receiverUser] = await Promise.all([
      this.dataSource
        .createQueryBuilder(User, 'u')
        .where('u.id = :id', { id: currentUserId })
        .getOne(),
      this.dataSource
        .createQueryBuilder(User, 'u')
        .where('u.id = :id', { id: friendRequest.receiverUserId })
        .getOne(),
    ]);

    if (!currentUser || !receiverUser) {
      throw new NotFoundException('User not found');
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
            text: `<b>${currentUser.fullname}</b> đã chấp nhận lời mời kết bạn.`,
            status: NotificationStatus.UNREAD,
            type: SOCIAL.ACCEPT_FRIEND_REQUEST,
            data: JSON.parse(
              JSON.stringify({
                ...friendRequest,
                senderUser: currentUser,
                receiverUser: receiverUser,
              }),
            ),
          },
        ])
        .execute();

      await this.dataSource
        .createQueryBuilder(UserNotification, 'un')
        .update()
        .set({
          status: NotificationStatus.READ,
          data: JSON.parse(
            JSON.stringify({
              id: friendRequest.id,
              status: FriendRequestStatus.ACCEPTED,
            }),
          ),
        })
        .where('data->>id = :id', { id: friendRequest.id })
        .execute();

      await this.dataSource
        .createQueryBuilder(User, 'u')
        .update()
        .set({
          friendCount: () => 'friendCount + 1',
        })
        .where('id IN (:...ids)', {
          ids: [friendRequest.senderUserId, friendRequest.receiverUserId],
        })
        .execute();

      return {
        success: true,
        message: 'Friend request accepted',
        status: FriendRequestStatus.ACCEPTED,
      };
    }

    if (status === FriendRequestStatus.REJECTED) {
      await this.dataSource
        .createQueryBuilder(UserFriendRequest, 'ufr')
        .delete()
        .where('id = :id', { id: friendRequestId })
        .execute();

      await this.dataSource
        .createQueryBuilder(UserNotification, 'un')
        .update()
        .set({
          status: NotificationStatus.READ,
          data: JSON.parse(
            JSON.stringify({
              id: friendRequest.id,
              status: FriendRequestStatus.REJECTED,
            }),
          ),
        })
        .where('data->>id = :id', { id: friendRequest.id })
        .execute();

      return {
        success: true,
        message: 'Friend request rejected',
        status: FriendRequestStatus.REJECTED,
      };
    }

    return {
      success: true,
      message: 'Friend request updated',
      status: status,
    };
  }

  async remove(id: number, { currentUserId }) {
    const friendRequest = await this.dataSource
      .createQueryBuilder(UserFriendRequest, 'ufr')
      .where('ufr.id = :id', { id })
      .getOne();

    if (!friendRequest) {
      throw new NotFoundException(`Friend request with ID ${id} not found`);
    }

    // Check that the current user is either the sender or receiver
    if (
      friendRequest.senderUserId !== currentUserId &&
      friendRequest.receiverUserId !== currentUserId
    ) {
      throw new ForbiddenException(
        'You are not authorized to delete this friend request',
      );
    }

    await this.dataSource
      .createQueryBuilder(UserFriendRequest, 'ufr')
      .delete()
      .where('id = :id', { id })
      .execute();

    return {
      success: true,
      message: 'Friend request deleted successfully',
    };
  }
}
