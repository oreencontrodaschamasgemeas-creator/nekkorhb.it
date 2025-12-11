import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

export enum AccessDecision {
  GRANTED = 'granted',
  DENIED = 'denied',
  PENDING = 'pending',
  ERROR = 'error',
}

export enum AccessDenyReason {
  NO_RULE = 'no_rule',
  OUTSIDE_TIME_WINDOW = 'outside_time_window',
  INVALID_ZONE = 'invalid_zone',
  MULTI_FACTOR_REQUIRED = 'multi_factor_required',
  MULTI_FACTOR_FAILED = 'multi_factor_failed',
  CREDENTIAL_REVOKED = 'credential_revoked',
  DAILY_LIMIT_EXCEEDED = 'daily_limit_exceeded',
  DEVICE_OFFLINE = 'device_offline',
  SYSTEM_ERROR = 'system_error',
  TAMPER_DETECTED = 'tamper_detected',
  INVALID_CREDENTIAL = 'invalid_credential',
}

@Entity('access_audit_logs')
@Index(['userId', 'createdAt'])
@Index(['deviceId', 'createdAt'])
@Index(['decision'])
export class AccessAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  deviceId: string;

  @Column({ nullable: true })
  zone: string;

  @Column({
    type: 'enum',
    enum: AccessDecision,
  })
  decision: AccessDecision;

  @Column({
    type: 'enum',
    enum: AccessDenyReason,
    nullable: true,
  })
  denyReason?: AccessDenyReason;

  @Column()
  credentialType: string;

  @Column({ nullable: true })
  credentialId: string;

  @Column({ type: 'integer' })
  responseTimeMs: number;

  @Column({ nullable: true })
  ruleId: string;

  @Column({ type: 'simple-array', default: '[]' })
  appliedFactors: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
