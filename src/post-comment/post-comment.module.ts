import { Module } from '@nestjs/common';
import { PostCommentService } from './post-comment.service';
import { PostCommentController } from './post-comment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [PostCommentController],
  providers: [PostCommentService],
})
export class PostCommentModule {}
