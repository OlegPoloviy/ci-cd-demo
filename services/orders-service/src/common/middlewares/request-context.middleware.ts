import type { NextFunction, Request, Response } from 'express';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { requestContext } from '../request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip =
      typeof forwardedFor === 'string' && forwardedFor.length > 0
        ? forwardedFor.split(',')[0].trim()
        : req.ip;
    const store = {
      queryCount: 0,
      requestId: req.requestId,
      correlationId: req.requestId,
      ip,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.originalUrl,
    };

    requestContext.run(store, () => {
      res.on('finish', () => {
        if (req.originalUrl.startsWith('/graphql')) {
          console.log(
            `[${req.method} ${req.originalUrl}] SQL queries: ${store.queryCount}`,
          );
        }
      });

      next();
    });
  }
}
