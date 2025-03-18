import { Module } from '@nestjs/common';
import { FriendService } from './friend.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserFriend } from 'src/entities';

@Module({
  imports: [TypeOrmModule.forFeature([UserFriend, User])],
  providers: [FriendService],
  exports: [FriendService],
})
export class FriendModule {}
