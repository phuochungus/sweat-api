import { Injectable, NotFoundException } from '@nestjs/common';
import { User, UserFriend, UserFriendRequest } from 'src/entities';
import { DataSource } from 'typeorm';
import { FilterFriendsDto } from 'src/user-friend/dto/filter-friend.dto';
import { PageDto, PageMetaDto } from 'src/common/dto';

@Injectable()
export class UserFriendService {
  constructor(private readonly dataSource: DataSource) {}

  async getFriends(filterFriendsDto: FilterFriendsDto, { currentUserId }) {
    const {
      userId,
      page,
      take,
      query,
      withMutualFriendsCount,
      withCurrentUserPendingRequest,
    } = filterFriendsDto;

    const queryBuilder = this.dataSource
      .createQueryBuilder(User, 'u')
      .innerJoin(
        UserFriend,
        'uf',
        `u.id = CASE WHEN uf.userId1 = :userId THEN uf.userId2 ELSE uf.userId1 END`,
      )
      .where('uf.userId1 = :userId OR uf.userId2 = :userId', { userId });

    if (query) {
      queryBuilder.andWhere('u.fullname LIKE :query', { query: `%${query}%` });
    }

    // Add pagination
    const skip = (page - 1) * take;
    queryBuilder.skip(skip).take(take);

    queryBuilder.orderBy('u.fullname', 'ASC');

    const totalFriendsCount = await queryBuilder.getCount();

    let friends = await queryBuilder.getMany();

    if (withMutualFriendsCount && currentUserId) {
      friends = await Promise.all(
        friends.map(async (friend) => {
          const mutualFriends = await this.getMutualFriends(
            currentUserId,
            friend.id,
          );
          return {
            ...friend,
            mutualFriendsCount: mutualFriends.length,
          };
        }),
      );
    }

    if (withCurrentUserPendingRequest && currentUserId) {
      friends = await Promise.all(
        friends.map(async (friend) => {
          const pendingRequest = await this.dataSource
            .createQueryBuilder(UserFriendRequest, 'ufr')
            .where(
              'uft.senderId = :friendId AND uft.receiverId = :currentUserId',
              { currentUserId, friendId: friend.id },
            )
            .getOne();

          return {
            ...friend,
            hasPendingRequest: !!pendingRequest,
          };
        }),
      );
    }

    const pageMetaDto = new PageMetaDto({
      itemCount: totalFriendsCount,
      pageOptionsDto: { page, take },
    });

    return new PageDto(friends, pageMetaDto);
  }

  async areFriends(userId1: number, userId2: number) {
    const friend = await this.dataSource
      .createQueryBuilder(UserFriend, 'uf')
      .where(
        '(uf.userId1 = :userId1 AND uf.userId2 = :userId2) OR (uf.userId1 = :userId2 AND uf.userId2 = :userId1)',
        { userId1, userId2 },
      )
      .getOne();

    return !!friend;
  }

  async getMutualFriends(userId1: number, userId2: number): Promise<User[]> {
    const user1Friends = await this.dataSource
      .createQueryBuilder(User, 'u')
      .innerJoin(
        UserFriend,
        'uf',
        `u.id = CASE WHEN uf.userId1 = :userId THEN uf.userId2 ELSE uf.userId1 END`,
      )
      .where('uf.userId1 = :userId OR uf.userId2 = :userId', {
        userId: userId1,
      })
      .getMany();

    const user2Friends = await this.dataSource
      .createQueryBuilder(User, 'u')
      .innerJoin(
        UserFriend,
        'uf',
        `u.id = CASE WHEN uf.userId1 = :userId THEN uf.userId2 ELSE uf.userId1 END`,
      )
      .where('uf.userId1 = :userId OR uf.userId2 = :userId', {
        userId: userId2,
      })
      .getMany();

    const user1FriendIds = user1Friends.map((friend) => friend.id);
    return user2Friends.filter((friend) => user1FriendIds.includes(friend.id));
  }

  async syncFriendCountForAllUser() {
    const users = await this.dataSource.createQueryBuilder(User, 'u').getMany();

    await Promise.all(
      users.map(async (user) => {
        const friendsCount = await this.dataSource
          .createQueryBuilder(UserFriend, 'uf')
          .where('uf.userId1 = :userId OR uf.userId2 = :userId', {
            userId: user.id,
          })
          .getCount();

        await this.dataSource
          .createQueryBuilder(User, 'u')
          .update()
          .set({ friendCount: friendsCount })
          .where('id = :id', { id: user.id })
          .execute();
      }),
    );
  }

  async unfriend(friendId: number, { currentUserId }) {
    const friend = await this.dataSource
      .createQueryBuilder(UserFriend, 'uf')
      .where(
        '(uf.userId1 = :currentUserId AND uf.userId2 = :friendId) OR (uf.userId1 = :friendId AND uf.userId2 = :currentUserId)',
        { currentUserId, friendId },
      )
      .getOne();

    if (!friend) {
      throw new NotFoundException('Friend not found');
    }

    await this.dataSource
      .createQueryBuilder(UserFriend, 'uf')
      .delete()
      .where('id = :id', { id: friend.id })
      .execute();

    await this.dataSource
      .createQueryBuilder(User, 'u')
      .update()
      .set({
        friendCount: () => 'friendCount - 1',
      })
      .where('id IN (:ids)', { ids: [currentUserId, friendId] })
      .execute();
  }

  async getSuggesstions({ userId }) {
    const suggestedUsers = await this.dataSource
      .createQueryBuilder(UserFriend, 'uf1')
      .innerJoin(UserFriend, 'uf2', 'uf1.userId2 = uf2.userId1')
      .leftJoin(
        UserFriend,
        'existingFriend',
        'existingFriend.userId1 = :userId AND existingFriend.userId2 = uf2.userId2',
      )
      .where('uf1.userId1 = :userId', { userId })
      .andWhere('existingFriend.userId1 IS NULL') // Ensures they are not already friends
      .select('uf2.userId2', 'suggestedUserId')
      .addSelect('COUNT(uf1.userId2)', 'mutualFriendCount')
      .groupBy('uf2.userId2')
      .orderBy('mutualFriendCount', 'DESC')
      .limit(5)
      .getRawMany();

    if (suggestedUsers.length == 0) {
      // If no suggestions are found, return random users
      return await this.dataSource
        .createQueryBuilder(User, 'u')
        .where('u.id != :userId', { userId })
        .orderBy('RAND()')
        .limit(5)
        .getMany();
    }

    return suggestedUsers;
  }
}
