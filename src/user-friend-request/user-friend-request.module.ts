import { Module } from '@nestjs/common';
import { UserFriendRequestService } from './user-friend-request.service';
import { UserFriendRequestController } from './user-friend-request.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserFriendRequest } from 'src/entities';

@Module({
  imports: [TypeOrmModule.forFeature([UserFriendRequest, User])],
  controllers: [UserFriendRequestController],
  providers: [UserFriendRequestService],
})
export class UserFriendRequestModule {}
