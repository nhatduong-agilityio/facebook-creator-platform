// Shared
import { BaseRepository } from '@/shared/repository';

// Types
import { AuditLogEntity } from '../entity';
import type { AuditLogEntryInput, AuditLogWriterPort } from '../ports';
import type { DataSource } from 'typeorm';

export class AuditLogRepository
  extends BaseRepository<AuditLogEntity>
  implements AuditLogWriterPort
{
  constructor(dataSource: DataSource) {
    super(dataSource, AuditLogEntity);
  }

  /**
   * Create and persist a new audit log entry.
   * @param {AuditLogEntryInput} data - the data to create the audit log entry with
   * @returns {Promise<AuditLogEntity>} - a promise that resolves to the created audit log entry
   */
  async createEntry(data: AuditLogEntryInput): Promise<AuditLogEntity> {
    return await this.repo.save(
      this.repo.create({
        userId: data.userId ?? null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId ?? null,
        metadata: data.metadata ?? null
      })
    );
  }
}
