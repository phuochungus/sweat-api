import { Module, forwardRef } from '@nestjs/common';
import { FriendService } from './friend.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserFriend } from 'src/entities';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserFriend, User]),
    forwardRef(() => UserModule),
  ],
  providers: [FriendService],
  exports: [FriendService],
})
export class FriendModule {}
