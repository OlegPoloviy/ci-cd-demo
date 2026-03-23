import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

export const REQUEST_ID = 'x-request-id';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Read header (may be string | string[] | undefined)
    const incoming = req.headers[REQUEST_ID];

    // Normalize to string
    let headerValue: string | undefined;
    if (Array.isArray(incoming)) {
      headerValue = incoming[0];
    } else {
      headerValue = incoming;
    }

    // Use existing ID or generate new one
    const requestId =
      headerValue && headerValue.trim().length > 0 ? headerValue : randomUUID();

    req.requestId = requestId;
    res.setHeader(REQUEST_ID, requestId);
    res.setHeader(REQUEST_ID, requestId);

    next();
  }
}
