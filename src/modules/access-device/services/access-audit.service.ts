import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AccessAuditLog,
  AccessDecision,
  AccessDenyReason,
} from '../entities/access-audit-log.entity';

export interface CreateAuditLogDto {
  userId: string;
  deviceId: string;
  zone?: string;
  decision: AccessDecision;
  denyReason?: AccessDenyReason;
  credentialType: string;
  credentialId?: string;
  responseTimeMs: number;
  ruleId?: string;
  appliedFactors?: string[];
  metadata?: Record<string, any>;
}

@Injectable()
export class AccessAuditService {
  private readonly logger = new Logger(AccessAuditService.name);

  constructor(
    @InjectRepository(AccessAuditLog)
    private auditRepository: Repository<AccessAuditLog>,
  ) {}

  async createAuditLog(createDto: CreateAuditLogDto): Promise<AccessAuditLog> {
    const auditLog = this.auditRepository.create({
      ...createDto,
      appliedFactors: createDto.appliedFactors || [],
    });

    const savedLog = await this.auditRepository.save(auditLog);

    // Log to system logger
    if (createDto.decision === AccessDecision.GRANTED) {
      this.logger.log(
        `Access GRANTED: User=${createDto.userId}, Device=${createDto.deviceId}, Time=${createDto.responseTimeMs}ms`,
      );
    } else {
      this.logger.warn(
        `Access DENIED: User=${createDto.userId}, Device=${createDto.deviceId}, Reason=${createDto.denyReason}, Time=${createDto.responseTimeMs}ms`,
      );
    }

    return savedLog;
  }

  async getLogsForUser(
    userId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<[AccessAuditLog[], number]> {
    return this.auditRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getLogsForDevice(
    deviceId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<[AccessAuditLog[], number]> {
    return this.auditRepository.findAndCount({
      where: { deviceId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getLogsForUserAndDevice(
    userId: string,
    deviceId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<[AccessAuditLog[], number]> {
    return this.auditRepository.findAndCount({
      where: { userId, deviceId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getDeniedAccessLogs(
    limit: number = 100,
    offset: number = 0,
  ): Promise<[AccessAuditLog[], number]> {
    return this.auditRepository.findAndCount({
      where: { decision: AccessDecision.DENIED },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getLogsByDecision(
    decision: AccessDecision,
    limit: number = 100,
    offset: number = 0,
  ): Promise<[AccessAuditLog[], number]> {
    return this.auditRepository.findAndCount({
      where: { decision },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getLogsInTimeRange(
    startDate: Date,
    endDate: Date,
    limit: number = 1000,
  ): Promise<AccessAuditLog[]> {
    return this.auditRepository
      .createQueryBuilder('log')
      .where('log.createdAt >= :startDate', { startDate })
      .andWhere('log.createdAt <= :endDate', { endDate })
      .orderBy('log.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getUserDailyAttempts(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // This is a simplified approach. In production, use a proper query.
    const logs = await this.auditRepository
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .andWhere('log.createdAt >= :startOfDay', { startOfDay })
      .getMany();

    return logs.length;
  }

  async getSecurityMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalAttempts: number;
    grantedAccess: number;
    deniedAccess: number;
    denialRate: number;
    avgResponseTime: number;
  }> {
    const logs = await this.getLogsInTimeRange(startDate, endDate, 10000);

    const granted = logs.filter((l) => l.decision === AccessDecision.GRANTED).length;
    const denied = logs.filter((l) => l.decision === AccessDecision.DENIED).length;
    const total = logs.length;
    const avgResponseTime =
      total > 0 ? logs.reduce((sum, l) => sum + l.responseTimeMs, 0) / total : 0;

    return {
      totalAttempts: total,
      grantedAccess: granted,
      deniedAccess: denied,
      denialRate: total > 0 ? denied / total : 0,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
    };
  }
}
