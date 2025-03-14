import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TaskScheduleService {
    constructor(private configService: ConfigService) { }

    @Cron('*/14 * * * *')
    async handleCron() {
        const renderAppUrl = this.configService.get('RENDER_APP_URL');
        if (!renderAppUrl) {
            return;
        }
        const response = await fetch(renderAppUrl);
    }
}
