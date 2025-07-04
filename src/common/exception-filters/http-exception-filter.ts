import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as Record<string, any>).message ||
            exception.message,
      ...(exceptionResponse as Record<string, any>),
    };

    // Add validation errors if they exist
    if (
      typeof exceptionResponse === 'object' &&
      (exceptionResponse as Record<string, any>).errors
    ) {
      errorResponse['errors'] = (
        exceptionResponse as Record<string, any>
      ).errors;
    }

    response.status(status).json(errorResponse);
  }
}
