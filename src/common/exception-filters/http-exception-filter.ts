import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const isDev = process.env.NODE_ENV === 'dev';
    const statusCode = exception?.status || 500;
    const message = exception?.message || 'Internal server error';

    const responseBody = {
      statusCode,
      message,
    };

    if (isDev && statusCode == 500) {
      (responseBody as any).error_stack = JSON.stringify(
        exception,
        Object.getOwnPropertyNames(exception),
      );
    }

    if (statusCode == 500) {
      this.logger.error(exception);
    }

    response.status(statusCode).json(responseBody);
  }
}
