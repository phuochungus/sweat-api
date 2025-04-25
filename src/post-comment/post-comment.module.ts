import { Module } from '@nestjs/common';
import { PostCommentService } from './post-comment.service';
import { PostCommentController } from './post-comment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post, PostComment, User } from 'src/entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, PostComment, Post])],
  controllers: [PostCommentController],
  providers: [PostCommentService],
})
export class PostCommentModule {}
