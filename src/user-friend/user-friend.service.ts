import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateUserFriendDto } from './dto/create-user-friend.dto';
import { UpdateUserFriendDto } from './dto/update-user-friend.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserFriend } from 'src/entities';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class UserFriendService {
  constructor(private readonly dataSource: DataSource) {}
  create(createUserFriendDto: CreateUserFriendDto) {
    return 'This action adds a new userFriend';
  }

  async getUserFriends({ userId }, { currentUserId }) {
    if (userId !== currentUserId) {
      throw new ForbiddenException({
        message: 'You are not allowed to access this resource',
      });
    }
    const result = await this.dataSource
      .createQueryBuilder(UserFriend, 'uf')
      .select(
        `CASE WHEN uf.uid1 = :userId THEN uf.uid2 ELSE uf.uid1 END`,
        'friend_id',
      )
      .where('uf.uid1 = :userId OR uf.uid2 = :userId', { userId })
      .getRawMany();

    return result.map((row) => row.friend_id);
  }

  findOne(id: number) {
    return `This action returns a #${id} userFriend`;
  }

  update(id: number, updateUserFriendDto: UpdateUserFriendDto) {
    return `This action updates a #${id} userFriend`;
  }

  remove(id: number) {
    return `This action removes a #${id} userFriend`;
  }
}
