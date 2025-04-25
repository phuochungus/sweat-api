import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthCheckService } from 'src/health/health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthCheckService) {}

  @Get()
  @ApiOperation({ summary: 'Check if the API is healthy' })
  check() {
    return this.healthService.check();
  }
}
