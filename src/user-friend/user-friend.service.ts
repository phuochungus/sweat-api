import { ForbiddenException, Injectable } from '@nestjs/common';
import { User, UserFriend } from 'src/entities';
import { DataSource } from 'typeorm';
import { FilterFriendsDto } from 'src/user-friend/dto/filter-friend.dto';
import { PageDto, PageMetaDto } from 'src/common/dto';

@Injectable()
export class UserFriendService {
  constructor(private readonly dataSource: DataSource) {}

  async getFriends(filterFriendsDto: FilterFriendsDto, { currentUserId }) {
    const { userId, page, take, query, withCommonFriendsCount } =
      filterFriendsDto;

    const queryBuilder = this.dataSource
      .createQueryBuilder(User, 'u')
      .innerJoin(
        UserFriend,
        'uf',
        `u.id = CASE WHEN uf.user_id1 = :userId THEN uf.user_id2 ELSE uf.user_id1 END`,
      )
      .where('uf.user_id1 = :userId OR uf.user_id2 = :userId', { userId });

    if (query) {
      queryBuilder.andWhere('u.username LIKE :query', { query: `%${query}%` });
    }

    // Add the common friends count calculation
    // This subquery counts mutual friends between the current user and each friend
    queryBuilder.addSelect((subQuery) => {
      return subQuery
        .select('COUNT(*)')
        .from(UserFriend, 'uf1')
        .innerJoin(
          UserFriend,
          'uf2',
          '(uf1.user_id1 = uf2.user_id1 OR uf1.user_id1 = uf2.user_id2 OR uf1.user_id2 = uf2.user_id1 OR uf1.user_id2 = uf2.user_id2) AND uf1.id != uf2.id',
        )
        .where(
          '(uf1.user_id1 = :userId OR uf1.user_id2 = :userId) AND (uf2.user_id1 = u.id OR uf2.user_id2 = u.id)',
          { userId },
        );
    }, 'commonFriends');

    // Fetch friends list
    const [friends, totalFriendsCount] = await Promise.all([
      queryBuilder
        .take(take)
        .skip((page - 1) * take)
        .getRawMany(),
      this.dataSource
        .createQueryBuilder(UserFriend, 'uf')
        .where('uf.user_id1 = :userId OR uf.user_id2 = :userId', { userId })
        .getCount(),
    ]);

    // Transform the raw results to include commonFriends as a numeric value
    const transformedFriends = friends.map((friend) => ({
      ...friend,
      commonFriends: parseInt(friend.commonFriends) || 0,
    }));

    // Create paginated response
    const pageMetaDto = new PageMetaDto({
      itemCount: totalFriendsCount,
      pageOptionsDto: { page, take },
    });

    return new PageDto(transformedFriends, pageMetaDto);
  }
}
