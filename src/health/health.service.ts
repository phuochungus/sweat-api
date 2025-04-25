import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthCheckService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  async check() {
    const startTime = Date.now();
    const dbStatus = await this.checkDatabase();
    const endTime = Date.now();

    return {
      status: dbStatus ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      env: this.configService.get('NODE_ENV'),
      database: {
        status: dbStatus ? 'connected' : 'disconnected',
      },
      responseTime: `${endTime - startTime}ms`,
    };
  }

  private async checkDatabase() {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }
}