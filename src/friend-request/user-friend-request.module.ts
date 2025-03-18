import { Module } from '@nestjs/common';
import { FriendRequestService } from './user-friend-request.service';
import { FriendRequestController } from './user-friend-request.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities';
import { FriendModule } from 'src/friend/friend.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), FriendModule],
  controllers: [FriendRequestController],
  providers: [FriendRequestService],
})
export class FriendRequestModule {}
