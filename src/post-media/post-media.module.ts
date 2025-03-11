import { Module } from '@nestjs/common';
import { PostMediaService } from './post-media.service';
import { PostMediaController } from './post-media.controller';
import { AwsModule } from 'src/aws/aws.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostMedia } from 'src/entities/post-media.entity';
import { User } from 'src/entities';

@Module({
  imports: [AwsModule, TypeOrmModule.forFeature([PostMedia, User])],
  controllers: [PostMediaController],
  providers: [PostMediaService],
})
export class PostMediaModule {}
