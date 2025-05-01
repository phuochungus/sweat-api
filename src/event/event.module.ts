import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event, EventParticipant, User } from 'src/entities';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { EventParticipantService } from './event-participant.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventParticipant, User])],
  controllers: [EventController],
  providers: [EventService, EventParticipantService],
  exports: [EventService, EventParticipantService],
})
export class EventModule {}
