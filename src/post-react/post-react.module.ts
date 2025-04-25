import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostReactController } from './post-react.controller';
import { PostReactService } from './post-react.service';
import { Post, PostComment, User, UserNotification } from 'src/entities';
import { PostReact } from 'src/entities/post-react.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostComment, PostReact, User, UserNotification]),
  ],
  controllers: [PostReactController],
  providers: [PostReactService],
  exports: [PostReactService],
})
export class PostReactModule {}