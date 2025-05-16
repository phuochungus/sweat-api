import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async syncFriendCount() {
    const query = `
      UPDATE "user" u
      SET "friendCount" = (
          SELECT COUNT(*)
          FROM user_friend uf
          WHERE (uf."userId1" = u.id OR uf."userId2" = u.id)
            AND uf."deletedAt" IS NULL
      );
    `;
    await this.dataSource.query(query);
  }
}
