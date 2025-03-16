import { Module } from '@nestjs/common';
import { UserFriendService } from './user-friend.service';
import { UserFriendController } from './user-friend.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserFriend } from 'src/entities';

@Module({
  imports: [TypeOrmModule.forFeature([UserFriend, User])],
  controllers: [UserFriendController],
  providers: [UserFriendService],
  exports: [UserFriendService],
})
export class UserFriendModule {}
