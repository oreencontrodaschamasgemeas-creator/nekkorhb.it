import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthAuditEvent, AuthAuditEventType } from '../entities/auth-audit-event.entity';

export interface AuthMetricsSnapshot {
  totalEvents: number;
  successEvents: number;
  failureEvents: number;
  issuedTokens: number;
  refreshedTokens: number;
  revokedTokens: number;
}

@Injectable()
export class AuthAuditService {
  private metrics: AuthMetricsSnapshot = {
    totalEvents: 0,
    successEvents: 0,
    failureEvents: 0,
    issuedTokens: 0,
    refreshedTokens: 0,
    revokedTokens: 0,
  };

  constructor(
    @InjectRepository(AuthAuditEvent)
    private readonly auditRepository: Repository<AuthAuditEvent>,
  ) {}

  async log(eventType: AuthAuditEventType, success: boolean, metadata: Record<string, any> = {}) {
    const event = this.auditRepository.create({
      eventType,
      success,
      userId: metadata.userId,
      clientId: metadata.clientId,
      metadata,
    });
    await this.auditRepository.save(event);
    this.bumpCounters(eventType, success);
    return event;
  }

  getMetrics(): AuthMetricsSnapshot {
    return { ...this.metrics };
  }

  async recent(limit = 20) {
    return this.auditRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  private bumpCounters(eventType: AuthAuditEventType, success: boolean) {
    this.metrics.totalEvents += 1;
    if (success) {
      this.metrics.successEvents += 1;
    } else {
      this.metrics.failureEvents += 1;
    }

    if (eventType === AuthAuditEventType.TOKEN_ISSUED) {
      this.metrics.issuedTokens += 1;
    }

    if (eventType === AuthAuditEventType.TOKEN_REFRESHED) {
      this.metrics.refreshedTokens += 1;
    }

    if (eventType === AuthAuditEventType.TOKEN_REVOKED) {
      this.metrics.revokedTokens += 1;
    }
  }
}
