import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { UserFriendModule } from 'src/user-friend/user-friend.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UserFriendModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
