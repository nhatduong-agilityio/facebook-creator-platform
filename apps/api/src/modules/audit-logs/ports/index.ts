import type { AuditLogEntity } from '../entity';

export type AuditLogEntryInput = {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export interface AuditLogWritePort {
  createEntry(data: AuditLogEntryInput): Promise<AuditLogEntity>;
}
