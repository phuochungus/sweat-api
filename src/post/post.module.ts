import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from 'src/entities/post.entity';
import { UserFriend } from 'src/entities/user-friend.entity';
import { User } from 'src/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Post, UserFriend, User])],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
