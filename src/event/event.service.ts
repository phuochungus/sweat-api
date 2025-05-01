import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Event, EventMedia, User } from 'src/entities';
import { CreateEventDto, UpdateEventDto, FilterEventsDto } from './dto';
import { PageDto, PageMetaDto } from 'src/common/dto';
import { EventParticipantService } from './event-participant.service';
import { ParticipantStatus } from 'src/common/enums';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private eventParticipantService: EventParticipantService,
    private dataSource: DataSource,
  ) {}

  async create(createEventDto: CreateEventDto) {
    // Verify creator exists
    const creator = await this.userRepository.findOne({
      where: { id: createEventDto.creatorId },
    });

    if (!creator) {
      throw new NotFoundException(
        `User with ID ${createEventDto.creatorId} not found`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // Create the event
      const event = manager.create(Event, createEventDto);
      const savedEvent = await manager.save(event);

      // Add creator as a participant automatically
      await this.eventParticipantService.create(
        {
          eventId: savedEvent.id,
          userId: createEventDto.creatorId,
          status: ParticipantStatus.GOING,
        },
        { currentUserId: createEventDto.creatorId, entityManager: manager },
      );

      // Process media attachments if provided
      if (createEventDto.media && createEventDto.media.length > 0) {
        const eventMedia = createEventDto.media.map((media) => {
          return manager.create(EventMedia, {
            ...media,
            eventId: savedEvent.id,
          });
        });

        await manager.save(eventMedia);
      }

      return this.findOne(savedEvent.id);
    });
  }

  async findAll(filterEventsDto: FilterEventsDto, { currentUserId }) {
    const {
      page = 1,
      take = 10,
      createdBy,
      privacy,
      location,
      fromDate,
      toDate,
      query,
      includes,
    } = filterEventsDto;

    // Ensure page and take are numbers
    const pageNum = Number(page);
    const takeNum = Number(take);
    const skip = (pageNum - 1) * takeNum;

    const queryBuilder = this.dataSource
      .createQueryBuilder(Event, 'event')
      .leftJoinAndSelect('event.creator', 'creator')
      .orderBy('event.startTime', 'ASC');

    // Apply filters
    if (createdBy) {
      queryBuilder.andWhere('event.creatorId = :creatorId', {
        creatorId: createdBy,
      });
    }

    if (privacy) {
      queryBuilder.andWhere('event.privacy = :privacy', { privacy });
    }

    if (location) {
      queryBuilder.andWhere('event.location LIKE :location', {
        location: `%${location}%`,
      });
    }

    if (fromDate) {
      queryBuilder.andWhere('event.startTime >= :fromDate', { fromDate });
    }

    if (toDate) {
      queryBuilder.andWhere('event.startTime <= :toDate', { toDate });
    }

    if (query) {
      queryBuilder.andWhere(
        '(event.title LIKE :query OR event.description LIKE :query)',
        { query: `%${query}%` },
      );
    }

    let [events, itemCount] = await Promise.all([
      queryBuilder.take(takeNum).skip(skip).getMany(),
      queryBuilder.getCount(),
    ]);

    // Check if user is participating in these events if requested
    if (includes?.includes('isParticipating') && currentUserId) {
      events = await Promise.all(
        events.map(async (event) => {
          const isParticipating =
            await this.eventParticipantService.isUserParticipating(
              currentUserId,
              event.id,
            );
          return {
            ...event,
            isParticipating,
          };
        }),
      );
    }

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: { page: pageNum, take: takeNum },
    });

    return new PageDto(events, pageMetaDto);
  }

  async findOne(id: number) {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async update(id: number, updateEventDto: UpdateEventDto, { currentUserId }) {
    const event = await this.findOne(id);

    // Only the creator can update the event
    if (event.creatorId !== currentUserId) {
      throw new ForbiddenException(
        'You are not authorized to update this event',
      );
    }

    await this.eventRepository.update(id, updateEventDto);

    return this.findOne(id);
  }

  async remove(id: number, { currentUserId }) {
    const event = await this.findOne(id);

    // Only the creator can delete the event
    if (event.creatorId !== currentUserId) {
      throw new ForbiddenException(
        'You are not authorized to delete this event',
      );
    }

    // Use transaction to ensure all related data is deleted properly
    return this.dataSource.transaction(async (manager) => {
      // Delete all comments first (including replies)
      await manager
        .createQueryBuilder()
        .delete()
        .from('event_comment')
        .where('eventId = :eventId', { eventId: id })
        .execute();

      // Delete event media
      await manager
        .createQueryBuilder()
        .delete()
        .from('event_media')
        .where('eventId = :eventId', { eventId: id })
        .execute();

      // Delete event participants
      await manager
        .createQueryBuilder()
        .delete()
        .from('event_participant')
        .where('eventId = :eventId', { eventId: id })
        .execute();

      // Finally delete the event itself
      await manager.delete(Event, id);

      return { deleted: true };
    });
  }

  async getFeed(userId: number, filterEventsDto: FilterEventsDto) {
    // Get events created by friends and public events
    const { page = 1, take = 10 } = filterEventsDto;

    // Ensure page and take are numbers
    const pageNum = Number(page);
    const takeNum = Number(take);
    const skip = (pageNum - 1) * takeNum;

    // Get all friends of the user
    const friendsQuery = this.dataSource
      .createQueryBuilder()
      .select(
        'CASE WHEN uf."userId1" = :userId THEN uf."userId2" ELSE uf."userId1" END',
        'friendId',
      )
      .from('user_friend', 'uf')
      .where('(uf."userId1" = :userId OR uf."userId2" = :userId)', { userId });

    const queryBuilder = this.dataSource
      .createQueryBuilder(Event, 'event')
      .leftJoinAndSelect('event.creator', 'creator')
      .where(
        '(event.creatorId IN (' +
          friendsQuery.getQuery() +
          ') OR event.privacy = :publicPrivacy)',
        { userId, publicPrivacy: 'PUBLIC' },
      )
      .setParameters(friendsQuery.getParameters())
      .orderBy('event.startTime', 'ASC');

    let [events, itemCount] = await Promise.all([
      queryBuilder.take(takeNum).skip(skip).getMany(),
      queryBuilder.getCount(),
    ]);

    // Check if user is participating in these events
    events = await Promise.all(
      events.map(async (event) => {
        const isParticipating =
          await this.eventParticipantService.isUserParticipating(
            userId,
            event.id,
          );
        return {
          ...event,
          isParticipating,
        };
      }),
    );

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: { page: pageNum, take: takeNum },
    });

    return new PageDto(events, pageMetaDto);
  }
}
