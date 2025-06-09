import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserFollowService } from './user-follow.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User,
  UserFriend,
  UserFriendRequest,
  UserFollow,
  UserNotification,
} from 'src/entities';
import { FriendModule } from 'src/friend/friend.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserFriend,
      UserFriendRequest,
      UserFollow,
      UserNotification,
    ]),
    forwardRef(() => FriendModule),
    NotificationModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserFollowService],
  exports: [UserService, UserFollowService],
})
export class UserModule {}
