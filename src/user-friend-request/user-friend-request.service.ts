import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserFriendRequestDto } from './dto/create-user-friend-request.dto';
import { UpdateUserFriendRequestDto } from './dto/update-user-friend-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserFriend, UserFriendRequest, UserNotification } from 'src/entities';
import { Repository } from 'typeorm';
import { FriendRequestStatus } from 'src/common/enums';

@Injectable()
export class UserFriendRequestService {
  constructor(
    @InjectRepository(UserFriendRequest)
    private userFriendRequestRepository: Repository<UserFriendRequest>,
    @InjectRepository(UserNotification)
    private userNotificationRepository: Repository<UserNotification>,
    @InjectRepository(UserFriend)
    private userFriendRepository: Repository<UserFriend>,
  ) {}

  async create(
    createUserFriendRequestDto: CreateUserFriendRequestDto,
    { currentUserId },
  ) {
    await this.userFriendRequestRepository.insert({
      senderUserId: currentUserId,
      receiverUserId: createUserFriendRequestDto.receiverUserId,
      status: FriendRequestStatus.PENDING,
    });

    //todo: send notification to receiver
  }

  findAll() {
    return `This action returns all userFriendRequest`;
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
    const friendRequest = await this.userFriendRequestRepository.findOne({
      where: { id: friendRequestId },
    });
    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    if (
      status != friendRequest.status &&
      friendRequest.receiverUserId !== currentUserId
    ) {
      throw new ForbiddenException(
        'You are not allowed to accept this request',
      );
    }

    await this.userFriendRequestRepository.update(friendRequestId, {
      status,
    });

    await this.userFriendRepository.insert({
      userId1: friendRequest.senderUserId,
      userId2: friendRequest.receiverUserId,
    });

    //todo: send notification to sender if request is accepted
  }

  remove(id: number) {
    return `This action removes a #${id} userFriendRequest`;
  }
}
