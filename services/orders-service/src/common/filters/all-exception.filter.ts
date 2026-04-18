import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GqlArgumentsHost, GqlContextType } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): any {
    const contextType = host.getType<GqlContextType | 'http'>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message =
      exception instanceof Error ? exception.message : 'Unknown error';
    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
      message = 'Internal server error occurred';
    }

    this.logException(exception, statusCode, message, host);

    if (contextType === 'graphql') {
      let errorCode = 'INTERNAL_SERVER_ERROR';

      if (exception instanceof HttpException) {
        if (statusCode === HttpStatus.BAD_REQUEST) {
          errorCode = 'BAD_USER_INPUT';
        } else if (statusCode === HttpStatus.NOT_FOUND) {
          errorCode = 'NOT_FOUND';
        } else {
          errorCode = HttpStatus[statusCode] || 'INTERNAL_SERVER_ERROR';
        }
      }

      return new GraphQLError(message, {
        extensions: {
          code: errorCode,
          status: statusCode,
          details:
            exception instanceof HttpException ? exception.getResponse() : null,
        },
      });
    }

    if (contextType === 'http') {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
      const sanitizedPath = this.sanitizeUrl(request.url);

      response.status(statusCode).json({
        timestamp: new Date().toISOString(),
        path: sanitizedPath,
        error: { message },
      });
    }
  }

  private logException(
    exception: unknown,
    statusCode: number,
    message: string,
    host: ArgumentsHost,
  ): void {
    const contextType = host.getType<GqlContextType | 'http'>();
    let method = 'GQL';
    let path = '/graphql';

    if (contextType === 'http') {
      const req = host.switchToHttp().getRequest<Request>();
      method = req.method;
      path = this.sanitizeUrl(req.url);
    }

    if (statusCode >= 500) {
      this.logger.error(
        `${method} ${path} - ${statusCode}: ${message}`,
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception),
      );
    } else {
      this.logger.warn(`${method} ${path} - ${statusCode}: ${message}`);
    }
  }

  private sanitizeUrl(url: string): string {
    return url
      .split('/')
      .map((segment) => this.sanitizeSegment(segment))
      .join('/');
  }

  private sanitizeSegment(segment: string): string {
    if (!segment) {
      return segment;
    }

    const [pathPart, queryPart] = segment.split('?', 2);
    const sanitizedPathPart = this.looksSensitive(pathPart)
      ? '[REDACTED]'
      : pathPart;

    if (!queryPart) {
      return sanitizedPathPart;
    }

    const sanitizedQuery = queryPart
      .split('&')
      .map((pair) => {
        const [key, value] = pair.split('=', 2);
        if (!value) {
          return key;
        }

        return this.looksSensitive(value) || this.isSensitiveKey(key)
          ? `${key}=[REDACTED]`
          : `${key}=${value}`;
      })
      .join('&');

    return `${sanitizedPathPart}?${sanitizedQuery}`;
  }

  private isSensitiveKey(key: string): boolean {
    return ['token', 'access_token', 'refresh_token', 'authorization'].includes(
      key.toLowerCase(),
    );
  }

  private looksSensitive(value: string): boolean {
    const decodedValue = this.safeDecodeURIComponent(value);

    return (
      /^Bearer\s+/i.test(decodedValue) ||
      /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(decodedValue)
    );
  }

  private safeDecodeURIComponent(value: string): string {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
}
