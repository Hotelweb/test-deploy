import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { TokenPayload } from '../auth/token.service.js';
import { AuditLog } from './entities/audit-log.entity.js';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async record(input: {
    actor?: TokenPayload;
    hotelId?: number | null;
    action: string;
    targetType?: string;
    targetId?: number | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.auditRepo.save(
        this.auditRepo.create({
          hotel_id: input.hotelId ?? input.actor?.hotel_id ?? null,
          actor_scope: input.actor?.scope ?? 'system',
          actor_user_id: input.actor?.sub ?? null,
          action: input.action,
          target_type: input.targetType ?? null,
          target_id: input.targetId ?? null,
          metadata: input.metadata ?? null,
        }),
      );
    } catch (err) {
      this.logger.warn(
        `Failed to write audit log for ${input.action}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}
