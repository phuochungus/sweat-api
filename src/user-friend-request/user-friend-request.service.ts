import { Injectable } from '@nestjs/common';
import { CreateUserFriendRequestDto } from './dto/create-user-friend-request.dto';
import { UpdateUserFriendRequestDto } from './dto/update-user-friend-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserFriendRequest } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class UserFriendRequestService {
  constructor(
    @InjectRepository(UserFriendRequest)
    private userFriendRequestRepository: Repository<UserFriendRequest>,
  ) {}

  create(createUserFriendRequestDto: CreateUserFriendRequestDto) {
    return 'This action adds a new userFriendRequest';
  }

  findAll() {
    return `This action returns all userFriendRequest`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userFriendRequest`;
  }

  update(id: number, updateUserFriendRequestDto: UpdateUserFriendRequestDto) {
    return `This action updates a #${id} userFriendRequest`;
  }

  remove(id: number) {
    return `This action removes a #${id} userFriendRequest`;
  }
}
