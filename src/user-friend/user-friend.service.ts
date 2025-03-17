import { Injectable, NotFoundException } from '@nestjs/common';
import { User, UserFriend } from 'src/entities';
import { DataSource } from 'typeorm';
import { FilterFriendsDto } from 'src/user-friend/dto/filter-friend.dto';
import { PageDto, PageMetaDto } from 'src/common/dto';

@Injectable()
export class UserFriendService {
  constructor(private readonly dataSource: DataSource) {}

  async getFriends(filterFriendsDto: FilterFriendsDto, { currentUserId }) {
    const { userId, page, take, query, withMutualFriendsCount } =
      filterFriendsDto;

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
}
