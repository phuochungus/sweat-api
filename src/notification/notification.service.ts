import { Injectable } from '@nestjs/common';
import { PageDto, PageMetaDto } from 'src/common/dto';
import { GenericFilter } from 'src/common/generic/paginate';
import { UserNotification } from 'src/entities';
import { UpdateNotificationDto } from 'src/notification/dto/update-notification.dto';
import { DataSource } from 'typeorm';

@Injectable()
export class NotificationService {
  constructor(private readonly dataSource: DataSource) {}

  async getAll(filterDto: GenericFilter, { userId }) {
    const { page, take } = filterDto;
    const skip = (page - 1) * take;

    const queryBuilder = this.dataSource
      .createQueryBuilder(UserNotification, 'un')
      .where('un.userId = :userId', { userId });

    const [item, itemCount] = await Promise.all([
      queryBuilder
        .orderBy('un.createdAt', 'DESC')
        .skip(skip)
        .take(take)
        .getMany(),
      queryBuilder.getCount(),
    ]);

    const pageDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: { page, take },
    });

    return new PageDto(item, pageDto);
  }

  async batchUpdate(updateDto: UpdateNotificationDto, { currentUserId }) {
    return await this.dataSource
      .createQueryBuilder(UserNotification, 'un')
      .update(UserNotification)
      .set(updateDto)
      .where('un.userId = :currentUserId AND un.id IN :ids', {
        currentUserId,
        ids: updateDto.ids,
      })
      .execute();
  }
}
