export type AuditActor = {
  actorId: string | null;
  actorRoles?: string[];
  actorScopes?: string[];
};

export type AuditTarget = {
  targetType: string;
  targetId: string | null;
};

export type AuditEventInput = AuditActor &
  AuditTarget & {
    action: string;
    outcome: 'success' | 'failure';
    reason?: string;
    metadata?: Record<string, unknown>;
  };

export type AuditEvent = AuditEventInput & {
  timestamp: string;
  correlationId: string | null;
  requestId: string | null;
  ip: string | null;
  userAgent: string | null;
};
