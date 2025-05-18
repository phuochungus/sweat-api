import { ForbiddenException, Injectable } from '@nestjs/common';
import { PageDto, PageMetaDto } from 'src/common/dto';
import { GenericFilter } from 'src/common/generic/paginate';
import { UserNotification } from 'src/entities';
import { FilterNotificationDto } from 'src/notification/dto/filter-notification.dto';
import { UpdateNotificationDto } from 'src/notification/dto/update-notification.dto';
import { DataSource } from 'typeorm';
import { NotificationStatus } from 'src/common/enums';

@Injectable()
export class NotificationService {
  constructor(private readonly dataSource: DataSource) {}

  async getAll(
    filterNotificationDto: FilterNotificationDto,
    { currentUserId },
  ) {
    const { page = 1, take = 10, status } = filterNotificationDto;

    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select('un.*')
      .addSelect('u.fullname', 'senderFullname')
      .addSelect('u.avatarUrl', 'senderAvatarUrl')
      .from('user_notification', 'un')
      .leftJoin('user', 'u', 'un.senderUserId = u.id')
      .where('un.receiverUserId = :receiverUserId', {
        receiverUserId: currentUserId,
      });

    if (status) {
      queryBuilder.andWhere('un.status = :status', { status });
    }

    queryBuilder
      .orderBy('un.createdAt', 'DESC')
      .limit(take)
      .offset((page - 1) * take);

    const [items, itemCount] = await Promise.all([
      queryBuilder.getRawMany(),
      queryBuilder.getCount(),
    ]);

    const unreadCount = await this.dataSource
      .createQueryBuilder()
      .select()
      .from('user_notification', 'un')
      .where('un.receiverUserId = :receiverUserId', {
        receiverUserId: currentUserId,
      })
      .andWhere('un.status = :status', { status: NotificationStatus.UNREAD })
      .getCount();

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: { page, take },
    });

    return {
      data: items,
      meta: pageMetaDto,
      unreadCount,
    };
  }

  async batchUpdate(updateDto: UpdateNotificationDto, { currentUserId }) {
    const { ids, status, updateAll } = updateDto;

    if (updateAll) {
      // Update all notifications to the specified status
      await this.dataSource
        .createQueryBuilder()
        .update('user_notification')
        .set({ status })
        .where('receiverUserId = :receiverUserId', {
          receiverUserId: currentUserId,
        })
        .execute();
      return { updated: true };
    } else if (ids && ids.length) {
      await this.dataSource
        .createQueryBuilder()
        .update('user_notification')
        .set({ status })
        .where('id IN (:...ids)', { ids })
        .andWhere('receiverUserId = :receiverUserId', {
          receiverUserId: currentUserId,
        })
        .execute();
    }
    return { updated: true };
  }
}
