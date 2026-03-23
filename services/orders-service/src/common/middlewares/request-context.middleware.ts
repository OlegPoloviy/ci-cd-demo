import type { NextFunction, Request, Response } from 'express';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { requestContext } from '../request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const store = { queryCount: 0 };

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
