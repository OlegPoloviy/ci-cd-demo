import { Injectable, Logger } from '@nestjs/common';
import { requestContext } from '../request-context';
import { AuditEvent, AuditEventInput } from './audit.types';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  log(input: AuditEventInput): AuditEvent {
    const context = requestContext.getStore();
    const event: AuditEvent = {
      ...input,
      actorRoles: input.actorRoles ?? [],
      actorScopes: input.actorScopes ?? [],
      timestamp: new Date().toISOString(),
      correlationId: context?.correlationId ?? null,
      requestId: context?.requestId ?? null,
      ip: context?.ip ?? null,
      userAgent: context?.userAgent ?? null,
    };

    this.logger.log(JSON.stringify(event));

    return event;
  }
}
