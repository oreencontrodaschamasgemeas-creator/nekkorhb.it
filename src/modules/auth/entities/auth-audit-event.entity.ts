import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum AuthAuditEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  TOKEN_ISSUED = 'token_issued',
  TOKEN_REFRESHED = 'token_refreshed',
  TOKEN_REVOKED = 'token_revoked',
  TOKEN_INTROSPECTED = 'token_introspected',
}

@Entity('auth_audit_events')
export class AuthAuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AuthAuditEventType })
  eventType: AuthAuditEventType;

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  clientId?: string;

  @Column({ default: false })
  success: boolean;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
