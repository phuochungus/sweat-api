import { Injectable, NotFoundException } from '@nestjs/common';
import { PageDto, PageMetaDto } from 'src/common/dto';
import { User, UserFriend, UserFriendRequest } from 'src/entities';
import { FilterFriendsDto } from 'src/friend/dto/filter-friend.dto';
import { DataSource } from 'typeorm';

@Injectable()
export class FriendService {
  constructor(private readonly dataSource: DataSource) {}

  // New findAll method that works with seed.ts
  async findAll(filterFriendsDto: FilterFriendsDto, { currentUserId }) {
    return this.getFriends(filterFriendsDto, {
      currentUserId,
      userId: currentUserId,
    });
  }

  async getFriends(
    filterFriendsDto: FilterFriendsDto,
    { currentUserId, userId },
  ) {
    const { page, take, query, includes } = filterFriendsDto;

    const queryBuilder = this.dataSource
      .createQueryBuilder(User, 'u')
      .innerJoin(
        UserFriend,
        'uf',
        `(uf.userId1 = :userId AND u.id = uf.userId2) OR (uf.userId2 = :userId AND u.id = uf.userId1)`,
        { userId },
      )
      .where('u.deletedAt IS NULL'); // Add filter for soft-deleted users

    if (query) {
      queryBuilder.andWhere(
        'unaccent(LOWER(u.fullname)) ILIKE unaccent(LOWER(:query))',
        {
          query: `%${query}%`,
        },
      );
    }

    // Add pagination
    const skip = (page - 1) * take;
    queryBuilder.skip(skip).take(take);

    queryBuilder.orderBy('u.fullname', 'ASC');

    const totalFriendsCount = await queryBuilder.getCount();

    let friends = await queryBuilder.getMany();

    if (includes?.includes('mutualFriendsCount') && currentUserId) {
      friends = await Promise.all(
        friends.map(async (friend) => {
          const mutualFriends = await this.getMutualFriends(
            currentUserId,
            friend.id,
          );
          return {
            ...friend,
            mutualFriends: mutualFriends,
            mutualFriendsCount: mutualFriends.length,
          };
        }),
      );
    }

    if (includes?.includes('pendingRequest') && currentUserId) {
      friends = await Promise.all(
        friends.map(async (friend) => {
          const pendingRequest = await this.dataSource
            .createQueryBuilder(UserFriendRequest, 'ufr')
            .where(
              'ufr.senderUserId = :friendId AND ufr.receiverUserId = :currentUserId',
              { currentUserId, friendId: friend.id },
            )
            .getOne();

          return {
            ...friend,
            pendingRequest: pendingRequest,
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
      .andWhere('u.deletedAt IS NULL') // Add filter for soft-deleted users
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
      .andWhere('u.deletedAt IS NULL') // Add filter for soft-deleted users
      .getMany();

    const user1FriendIds = user1Friends.map((friend) => friend.id);
    return user2Friends.filter((friend) => user1FriendIds.includes(friend.id));
  }

  async syncFriendCountForAllUser() {
    const users = await this.dataSource
      .createQueryBuilder(User, 'u')
      .where('u.deletedAt IS NULL') // Only count non-deleted users
      .getMany();

    await Promise.all(
      users.map(async (user) => {
        const friendsCount = await this.dataSource
          .createQueryBuilder(UserFriend, 'uf')
          .innerJoin(
            User, 
            'friend', 
            '(uf.userId1 = :userId AND friend.id = uf.userId2) OR (uf.userId2 = :userId AND friend.id = uf.userId1)',
            { userId: user.id }
          )
          .where('friend.deletedAt IS NULL') // Only count non-deleted friends
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

  async unfriend({ currentUserId, userId }) {
    // First verify that neither user is deleted
    const users = await this.dataSource
      .createQueryBuilder(User, 'u')
      .where('u.id IN (:...ids)', { ids: [currentUserId, userId] })
      .andWhere('u.deletedAt IS NULL')
      .getMany();
      
    if (users.length !== 2) {
      throw new NotFoundException('One or both users not found or deleted');
    }
    
    const friend = await this.dataSource
      .createQueryBuilder(UserFriend, 'uf')
      .where(
        '(uf.userId1 = :currentUserId AND uf.userId2 = :friendId) OR (uf.userId1 = :friendId AND uf.userId2 = :currentUserId)',
        { currentUserId, friendId: userId },
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
        friendCount: () => '"friendCount" - 1',
      })
      .where('id IN (:...ids)', {
        ids: [Number(currentUserId), Number(userId)],
      })
      .execute();
  }

  async getSuggestions({ userId, limit = 5 }) {
    const suggestedUserIds = await this.dataSource
      .createQueryBuilder(UserFriend, 'uf1')
      .innerJoin(UserFriend, 'uf2', 'uf1.userId2 = uf2.userId1')
      .leftJoin(
        UserFriend,
        'existingFriend',
        'existingFriend.userId1 = :userId AND existingFriend.userId2 = uf2.userId2',
        { userId },
      )
      .where('uf1.userId1 = :userId', { userId })
      .andWhere('existingFriend.userId1 IS NULL') // Ensures they are not already friends
      .select('uf2.userId2', 'suggestedUserId')
      .addSelect('COUNT(uf1.userId2)', 'mutualFriendCount')
      .groupBy('uf2.userId2')
      .orderBy('"mutualFriendCount"', 'DESC') // ✅ Fix: Use double quotes
      .limit(5)
      .getRawMany();

    if (suggestedUserIds.length === 0) {
      return [];
    }
    let users = await this.dataSource
      .createQueryBuilder(User, 'u')
      .where('u.id IN (:...ids)', {
        ids: suggestedUserIds.map((s) => s.suggestedUserId),
      })
      .andWhere('u.deletedAt IS NULL') // Only suggest non-deleted users
      .getMany();

    users = await Promise.all(
      users.map(async (user) => {
        const suggestedUser = suggestedUserIds.find(
          (s) => s.suggestedUserId === user.id,
        );
        return {
          ...user,
          mutualFriendCount: +suggestedUser.mutualFriendCount,
          mutualFriends: await this.getMutualFriends(userId, user.id),
        };
      }),
    );

    if (users.length < limit) {
      const randomUsers = await this.dataSource
        .createQueryBuilder(User, 'u')
        .where('u.id != :userId', { userId })
        .andWhere('u.deletedAt IS NULL') // Only suggest non-deleted users
        .orderBy('RANDOM()') // ✅ Fix: Use "RANDOM()" for PostgreSQL (instead of "RAND()")
        .limit(limit - users.length)
        .getMany();

      users.push(...randomUsers);
    }
    return users;
  }

  /**
   * Clean up friendships when a user is deleted
   * This method should be called after a user is soft-deleted
   * @param userId - The ID of the deleted user
   */
  async cleanUpFriendshipsForDeletedUser(userId: number) {
    // Get all friends of the deleted user
    const friendships = await this.dataSource
      .createQueryBuilder(UserFriend, 'uf')
      .where('uf.userId1 = :userId OR uf.userId2 = :userId', { userId })
      .getMany();
    
    if (friendships.length === 0) {
      return; // No friendships to clean up
    }
    
    // Get the IDs of all friends
    const friendIds = friendships.map(friendship => 
      friendship.userId1 === userId ? friendship.userId2 : friendship.userId1
    );
    
    // Delete all friendship records
    await this.dataSource
      .createQueryBuilder(UserFriend, 'uf')
      .delete()
      .where('uf.userId1 = :userId OR uf.userId2 = :userId', { userId })
      .execute();
    
    // Update friend counts for all affected users
    await this.dataSource
      .createQueryBuilder(User, 'u')
      .update()
      .set({
        friendCount: () => '"friendCount" - 1',
      })
      .where('id IN (:...ids)', { ids: friendIds })
      .execute();
  }
}
