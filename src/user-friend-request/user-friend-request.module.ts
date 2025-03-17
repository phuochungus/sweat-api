import { Module } from '@nestjs/common';
import { UserFriendRequestService } from './user-friend-request.service';
import { UserFriendRequestController } from './user-friend-request.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserFriendRequestController],
  providers: [UserFriendRequestService],
})
export class UserFriendRequestModule {}
