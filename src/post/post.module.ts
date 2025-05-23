import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from 'src/entities/post.entity';
import { UserFriend } from 'src/entities/user-friend.entity';
import { User, UserNotification } from 'src/entities';
import { ImageProcessingModule } from 'src/image-processing/image-processing.module';
import { VideoProcessingModule } from 'src/video-processing/video-processing.module';
import { NSFWDetectionModule } from 'src/nsfw-detection/nsfw-detection.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, UserFriend, User, UserNotification]),
    ImageProcessingModule,
    VideoProcessingModule,
    NSFWDetectionModule,
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
