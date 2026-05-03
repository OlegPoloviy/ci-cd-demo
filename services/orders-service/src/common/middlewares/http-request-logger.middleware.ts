import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class HttpRequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const method = req.method;
      const path = this.sanitizeUrl(req.originalUrl || req.url);
      const statusCode = res.statusCode;
      const requestId = req.requestId ?? res.getHeader('x-request-id') ?? '-';

      this.logger.log(
        `${method} ${path} ${statusCode} ${durationMs.toFixed(1)}ms requestId=${requestId}`,
      );
    });

    next();
  }

  private sanitizeUrl(url: string): string {
    const [path, query] = url.split('?', 2);
    if (!query) {
      return path;
    }

    const sanitizedQuery = query
      .split('&')
      .map((pair) => {
        const [key, value] = pair.split('=', 2);
        if (!value) {
          return key;
        }

        return this.isSensitiveKey(key) ? `${key}=[REDACTED]` : pair;
      })
      .join('&');

    return `${path}?${sanitizedQuery}`;
  }

  private isSensitiveKey(key: string): boolean {
    return ['token', 'access_token', 'refresh_token', 'authorization'].includes(
      key.toLowerCase(),
    );
  }
}
