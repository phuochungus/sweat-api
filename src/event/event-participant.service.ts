import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Event, EventParticipant, User } from 'src/entities';
import { EventParticipantDto, FilterParticipantsDto } from './dto';
import { PageDto, PageMetaDto } from 'src/common/dto';

@Injectable()
export class EventParticipantService {
  constructor(
    @InjectRepository(EventParticipant)
    private eventParticipantRepository: Repository<EventParticipant>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(
    eventParticipantDto: EventParticipantDto,
    { currentUserId, entityManager = this.dataSource.manager },
  ) {
    const { eventId, userId, status } = eventParticipantDto;

    // For invitations, currentUserId can be different from userId
    // For self-joining, they must be the same
    if (status !== 'INVITED' && currentUserId !== userId) {
      throw new ForbiddenException('You can only join events for yourself');
    }

    // Verify event exists
    const event = await entityManager.findOne(Event, {
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Verify user exists
    const user = await entityManager.findOne(User, {
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if the participation already exists
    const existingParticipation = await entityManager.findOne(
      EventParticipant,
      {
        where: { eventId, userId },
      },
    );

    if (existingParticipation) {
      // Update the status if it already exists
      await entityManager.update(
        EventParticipant,
        { id: existingParticipation.id },
        { status },
      );

      return await entityManager.findOne(EventParticipant, {
        where: { id: existingParticipation.id },
        relations: ['user', 'event'],
      });
    }

    // Create new participation
    const eventParticipant = entityManager.create(EventParticipant, {
      eventId,
      userId,
      status,
    });

    const savedParticipant = await entityManager.save(eventParticipant);

    // Increment participant count
    await entityManager
      .createQueryBuilder()
      .update(Event)
      .set({ participantCount: () => 'participantCount + 1' })
      .where('id = :id', { id: eventId })
      .execute();

    return await entityManager.findOne(EventParticipant, {
      where: { id: savedParticipant.id },
      relations: ['user', 'event'],
    });
  }

  async findAll(
    eventId: number,
    filterDto: FilterParticipantsDto,
    { currentUserId },
  ) {
    const { page = 1, take = 10, status } = filterDto;

    // Ensure page and take are numbers
    const pageNum = Number(page);
    const takeNum = Number(take);
    const skip = (pageNum - 1) * takeNum;

    // Verify event exists
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const queryBuilder = this.dataSource
      .createQueryBuilder(EventParticipant, 'participant')
      .leftJoinAndSelect('participant.user', 'user')
      .where('participant.eventId = :eventId', { eventId });

    if (status) {
      queryBuilder.andWhere('participant.status = :status', { status });
    }

    const [participants, itemCount] = await Promise.all([
      queryBuilder.take(takeNum).skip(skip).getMany(),
      queryBuilder.getCount(),
    ]);

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: { page: pageNum, take: takeNum },
    });

    return new PageDto(participants, pageMetaDto);
  }

  async update(
    eventId: number,
    userId: number,
    eventParticipantDto: Partial<EventParticipantDto>,
    { currentUserId },
  ) {
    // Only allow users to update their own participation status
    if (currentUserId !== userId) {
      throw new ForbiddenException(
        'You can only update your own participation status',
      );
    }

    const participant = await this.eventParticipantRepository.findOne({
      where: { eventId, userId },
    });

    if (!participant) {
      throw new NotFoundException(`Participation record not found`);
    }

    await this.eventParticipantRepository.update(
      participant.id,
      eventParticipantDto,
    );

    return this.eventParticipantRepository.findOne({
      where: { id: participant.id },
      relations: ['user', 'event'],
    });
  }

  async remove(eventId: number, userId: number, { currentUserId }) {
    // Only allow users to leave events they joined
    if (currentUserId !== userId) {
      throw new ForbiddenException('You can only leave events you joined');
    }

    const participant = await this.eventParticipantRepository.findOne({
      where: { eventId, userId },
    });

    if (!participant) {
      throw new NotFoundException(`Participation record not found`);
    }

    // Delete the participant record
    await this.eventParticipantRepository.delete(participant.id);

    // Decrement participant count
    await this.dataSource
      .createQueryBuilder()
      .update(Event)
      .set({ participantCount: () => 'participantCount - 1' })
      .where('id = :id', { id: eventId })
      .execute();

    return { deleted: true };
  }

  async isUserParticipating(userId: number, eventId: number): Promise<boolean> {
    const count = await this.eventParticipantRepository.count({
      where: { userId, eventId },
    });
    return count > 0;
  }
}
