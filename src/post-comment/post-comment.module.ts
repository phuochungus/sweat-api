import { Module } from '@nestjs/common';
import { PostCommentService } from './post-comment.service';
import { PostCommentController } from './post-comment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post, PostComment, User, UserFollow, UserNotification } from 'src/entities';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PostComment, Post, UserFollow, UserNotification]),
    UserModule,
  ],
  controllers: [PostCommentController],
  providers: [PostCommentService],
})
export class PostCommentModule {}
