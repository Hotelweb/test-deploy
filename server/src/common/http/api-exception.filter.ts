import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface RequestWithId extends Request {
  id?: string;
}

interface ErrorDetail {
  field?: string;
  code: string;
  message: string;
}

interface ErrorBody {
  code?: string;
  message?: string | string[];
  details?: ErrorDetail[];
  error?: string;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<RequestWithId>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const normalized = this.normalizeBody(body, status);

    response.status(status).json({
      error: {
        code: normalized.code,
        message: normalized.message,
        details: normalized.details,
        request_id: request.id,
      },
    });
  }

  private normalizeBody(
    body: string | object | undefined,
    status: number,
  ): { code: string; message: string; details?: ErrorDetail[] } {
    if (typeof body === 'object' && body !== null) {
      const typed = body as ErrorBody;
      const message = Array.isArray(typed.message)
        ? typed.message.join('; ')
        : typed.message;

      return {
        code: typed.code ?? this.codeForStatus(status),
        message: message ?? typed.error ?? this.messageForStatus(status),
        details: typed.details,
      };
    }

    return {
      code: this.codeForStatus(status),
      message: typeof body === 'string' ? body : this.messageForStatus(status),
    };
  }

  private codeForStatus(status: number): string {
    const codes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
    };
    return codes[status] ?? 'API_ERROR';
  }

  private messageForStatus(status: number): string {
    if (status >= 500) return 'An unexpected error occurred';
    return 'The request could not be completed';
  }
}
