import { ForbiddenException, Injectable } from '@nestjs/common';
import { PageMetaDto } from 'src/common/dto';
import { FilterNotificationDto } from 'src/notification/dto/filter-notification.dto';
import { UpdateNotificationDto } from 'src/notification/dto/update-notification.dto';
import { DataSource } from 'typeorm';
import { NotificationStatus } from 'src/common/enums';
import { SOCIAL } from 'src/notification/enum';

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

    let [items, itemCount] = await Promise.all([
      queryBuilder.getRawMany(),
      queryBuilder.getCount(),
    ]);

    let promises = items.map(async (item) => {
      let data = null;
      if (item.type == SOCIAL.CREATE_FRIEND_REQUEST) {
        const friendRequestId = item.data.id;
        if (friendRequestId) {
          data = await this.dataSource
            .createQueryBuilder()
            .select('ufr')
            .from('user_friend_request', 'ufr')
            .where('ufr.id = :friendRequestId', { friendRequestId })
            .getOne();
        }
      }

      item.data = data;
      return item;
    });

    await Promise.all(promises);

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

  async deleteNotification(id: number, { currentUserId }) {
    const notification = await this.dataSource
      .createQueryBuilder()
      .select('un')
      .from('user_notification', 'un')
      .where('un.id = :id', { id })
      .andWhere('un.receiverUserId = :receiverUserId', {
        receiverUserId: currentUserId,
      })
      .getOne();

    if (!notification) {
      throw new ForbiddenException('Notification not found');
    }

    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('user_notification')
      .where('id = :id', { id })
      .execute();

    return { deleted: true };
  }
}
