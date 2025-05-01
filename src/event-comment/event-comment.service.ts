import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Event, EventComment, User } from 'src/entities';
import {
  CreateEventCommentDto,
  FilterEventCommentDto,
  UpdateEventCommentDto,
} from './dto';
import { PageDto, PageMetaDto } from 'src/common/dto';

@Injectable()
export class EventCommentService {
  constructor(
    @InjectRepository(EventComment)
    private eventCommentRepository: Repository<EventComment>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(
    createEventCommentDto: CreateEventCommentDto,
    { currentUserId },
  ) {
    const { eventId, replyCommentId, text } = createEventCommentDto;

    // Verify the event exists
    const event = await this.eventRepository.findOne({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with id ${eventId} not found`);
    }

    let parentComment = null;
    if (replyCommentId) {
      parentComment = await this.eventCommentRepository.findOne({
        where: {
          id: replyCommentId,
        },
      });

      if (!parentComment) {
        throw new NotFoundException(
          `Parent comment with id ${replyCommentId} not found`,
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      // Create the comment
      const comment = this.eventCommentRepository.create({
        userId: currentUserId,
        eventId,
        text,
        replyCommentId,
      });

      const savedComment = await manager.save(comment);

      // Increment event comment count
      await manager
        .createQueryBuilder()
        .update(Event)
        .set({
          commentCount: () => 'commentCount + 1',
        })
        .where('id = :id', { id: eventId })
        .execute();

      // If it's a reply, increment the parent comment's reply count
      if (replyCommentId) {
        await manager
          .createQueryBuilder()
          .update(EventComment)
          .set({
            replyCount: () => 'replyCount + 1',
          })
          .where('id = :id', { id: replyCommentId })
          .execute();
      }

      // Get the full comment with the user information
      const fullComment = await manager.findOne(EventComment, {
        where: { id: savedComment.id },
        relations: ['user'],
      });

      return fullComment;
    });
  }

  async findAll(filterDto: FilterEventCommentDto, { currentUserId }) {
    const {
      page = 1,
      take = 10,
      eventId,
      replyCommentId,
      includes,
    } = filterDto;

    // Ensure page and take are numbers
    const pageNum = Number(page);
    const takeNum = Number(take);
    const skip = (pageNum - 1) * takeNum;

    // Process replyCommentId: null means top-level comments
    // Handle empty string as null, and make sure the value is a proper number if provided

    const queryBuilder = this.dataSource
      .createQueryBuilder(EventComment, 'comment')
      .leftJoinAndSelect('comment.user', 'user')
      .orderBy('comment.createdAt', 'DESC');

    if (eventId) {
      queryBuilder.andWhere('comment.eventId = :eventId', { eventId });
    }

    if (replyCommentId) {
      queryBuilder.andWhere('comment.replyCommentId = :replyCommentId', {
        replyCommentId,
      });
    } else {
      queryBuilder.andWhere('comment.replyCommentId IS NULL');
    }
    queryBuilder.orderBy('comment.createdAt', 'DESC');

    const [items, itemCount] = await Promise.all([
      queryBuilder.take(takeNum).skip(skip).getMany(),
      queryBuilder.getCount(),
    ]);

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: { page: pageNum, take: takeNum },
    });

    return new PageDto(items, pageMetaDto);
  }

  async findOne(id: number) {
    const comment = await this.eventCommentRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return comment;
  }

  async update(
    id: number,
    updateEventCommentDto: UpdateEventCommentDto,
    { currentUserId },
  ) {
    const comment = await this.eventCommentRepository.findOne({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    if (comment.userId !== currentUserId) {
      throw new ForbiddenException(
        'You are not authorized to update this comment',
      );
    }

    await this.eventCommentRepository.update(id, updateEventCommentDto);
    return this.findOne(id);
  }

  async remove(id: number, { currentUserId }) {
    const comment = await this.eventCommentRepository.findOne({
      where: { id },
      relations: ['event'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    if (comment.userId !== currentUserId) {
      throw new ForbiddenException(
        'You are not authorized to delete this comment',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // If this is a parent comment, delete all replies
      if (comment.replyCount > 0) {
        await manager
          .createQueryBuilder()
          .delete()
          .from(EventComment)
          .where('replyCommentId = :id', { id })
          .execute();
      }

      // Delete the comment itself
      await manager.delete(EventComment, id);

      // Update event comment count
      await manager
        .createQueryBuilder()
        .update(Event)
        .set({
          commentCount: () => 'commentCount - 1',
        })
        .where('id = :id', { id: comment.eventId })
        .execute();

      // If it's a reply, decrement parent comment's reply count
      if (comment.replyCommentId) {
        await manager
          .createQueryBuilder()
          .update(EventComment)
          .set({
            replyCount: () => 'replyCount - 1',
          })
          .where('id = :id', { id: comment.replyCommentId })
          .execute();
      }

      return { deleted: true };
    });
  }
}
