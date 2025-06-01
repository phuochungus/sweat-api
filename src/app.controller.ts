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
  async syncCount() {
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

  @Cron(CronExpression.EVERY_10_MINUTES)
  async syncReactCount() {
    const query = `
      UPDATE public.post p
      SET "reactCount" = COALESCE(r.react_count, 0)
      FROM (
          SELECT "postId", COUNT(*) AS react_count
          FROM public.post_react
          WHERE "deletedAt" IS NULL
            AND "postId" IS NOT NULL
          GROUP BY "postId"
      ) r
      WHERE p.id = r."postId";
      );
    `;
    await this.dataSource.query(query);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async syncCommentCount() {
    const query = `
      UPDATE public.post p
      SET "commentCount" = COALESCE(c.comment_count, 0)
      FROM (
          SELECT "postId", COUNT(*) AS comment_count
          FROM public.post_comment
          WHERE "deletedAt" IS NULL
            AND "postId" IS NOT NULL
          GROUP BY "postId"
      ) c
      WHERE p.id = c."postId";
    `;
    await this.dataSource.query(query);
  }
}
