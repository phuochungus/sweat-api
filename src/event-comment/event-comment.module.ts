import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventComment, Event, User } from 'src/entities';
import { EventCommentController } from './event-comment.controller';
import { EventCommentService } from './event-comment.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventComment, User])],
  controllers: [EventCommentController],
  providers: [EventCommentService],
})
export class EventCommentModule {}
