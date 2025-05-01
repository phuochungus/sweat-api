import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth, User } from 'src/common/decorators';
import { JwtGuard } from 'src/common/guards';
import { EventService } from './event.service';
import { CreateEventDto, FilterEventsDto, UpdateEventDto } from './dto';
import { PageDto } from 'src/common/dto';
import { EventParticipantService } from './event-participant.service';
import { EventParticipantDto, FilterParticipantsDto } from './dto';

@ApiTags('events')
@Controller('events')
@Auth()
@UseGuards(JwtGuard)
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly eventParticipantService: EventParticipantService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventService.create(createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get events with filters' })
  @ApiResponse({ status: 200, description: 'Returns events', type: PageDto })
  findAll(
    @User('id') userId: number,
    @Query() filterEventsDto: FilterEventsDto,
  ) {
    return this.eventService.findAll(filterEventsDto, {
      currentUserId: userId,
    });
  }

  @Get('feed')
  @ApiOperation({ summary: 'Get event feed for current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns event feed',
    type: PageDto,
  })
  getFeed(
    @User('id') userId: number,
    @Query() filterEventsDto: FilterEventsDto,
  ) {
    return this.eventService.getFeed(userId, filterEventsDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({ status: 200, description: 'Returns event details' })
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an event' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @User('id') userId: number,
  ) {
    return this.eventService.update(+id, updateEventDto, {
      currentUserId: userId,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  remove(@Param('id') id: string, @User('id') userId: number) {
    return this.eventService.remove(+id, { currentUserId: userId });
  }

  @Post(':id/participants')
  @ApiOperation({ summary: 'Join an event or update participation status' })
  @ApiResponse({ status: 201, description: 'Joined event successfully' })
  joinEvent(
    @Param('id') eventId: string,
    @User('id') userId: number,
    @Body() participantDto: Partial<EventParticipantDto>,
  ) {
    return this.eventParticipantService.create(
      {
        eventId: +eventId,
        userId,
        status: participantDto.status,
      },
      { currentUserId: userId },
    );
  }

  @Get(':id/participants')
  @ApiOperation({ summary: 'Get event participants' })
  @ApiResponse({
    status: 200,
    description: 'Returns participants list',
    type: PageDto,
  })
  getParticipants(
    @Param('id') eventId: string,
    @User('id') userId: number,
    @Query() filterDto: FilterParticipantsDto,
  ) {
    return this.eventParticipantService.findAll(+eventId, filterDto, {
      currentUserId: userId,
    });
  }

  @Patch(':id/participants/:userId')
  @ApiOperation({ summary: 'Update participation status' })
  @ApiResponse({
    status: 200,
    description: 'Participation updated successfully',
  })
  updateParticipation(
    @Param('id') eventId: string,
    @Param('userId') participantId: string,
    @User('id') userId: number,
    @Body() participantDto: Partial<EventParticipantDto>,
  ) {
    return this.eventParticipantService.update(
      +eventId,
      +participantId,
      participantDto,
      { currentUserId: userId },
    );
  }

  @Delete(':id/participants/:userId')
  @ApiOperation({ summary: 'Leave an event' })
  @ApiResponse({ status: 200, description: 'Left event successfully' })
  leaveEvent(
    @Param('id') eventId: string,
    @Param('userId') participantId: string,
    @User('id') userId: number,
  ) {
    return this.eventParticipantService.remove(+eventId, +participantId, {
      currentUserId: userId,
    });
  }
}
