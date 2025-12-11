import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { IncidentAnnotation } from './incident-annotation.entity';
import { IncidentEvidenceLink } from './incident-evidence-link.entity';

export enum IncidentStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum IncidentPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum IncidentCategory {
  ACCESS_DENIAL = 'access_denial',
  DEVICE_MALFUNCTION = 'device_malfunction',
  SENSOR_ALERT = 'sensor_alert',
  SECURITY_BREACH = 'security_breach',
  SYSTEM_FAILURE = 'system_failure',
  NETWORK_ISSUE = 'network_issue',
  MAINTENANCE = 'maintenance',
  OTHER = 'other',
}

export enum IncidentSource {
  SENSOR = 'sensor',
  ACCESS_CONTROL = 'access_control',
  MANUAL = 'manual',
  SYSTEM = 'system',
}

@Entity('incidents')
@Index(['status', 'priority'])
@Index(['deviceId'])
@Index(['createdAt'])
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.OPEN,
  })
  status: IncidentStatus;

  @Column({
    type: 'enum',
    enum: IncidentPriority,
    default: IncidentPriority.MEDIUM,
  })
  priority: IncidentPriority;

  @Column({
    type: 'enum',
    enum: IncidentCategory,
    nullable: true,
  })
  category: IncidentCategory;

  @Column({
    type: 'enum',
    enum: IncidentSource,
    default: IncidentSource.MANUAL,
  })
  source: IncidentSource;

  @Column({ nullable: true })
  deviceId: string;

  @Column({ nullable: true })
  assignedTo: string;

  @Column('text', { array: true, default: () => "'{}'" })
  assignees: string[];

  @Column({ type: 'timestamp', nullable: true })
  slaDeadline: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  escalatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt: Date;

  @Column({ nullable: true })
  acknowledgedBy: string;

  @Column('simple-json', { nullable: true })
  resolutionChecklist: { item: string; completed: boolean }[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => IncidentAnnotation, (annotation) => annotation.incident, {
    eager: false,
    cascade: true,
  })
  annotations: IncidentAnnotation[];

  @OneToMany(() => IncidentEvidenceLink, (evidence) => evidence.incident, {
    eager: false,
    cascade: true,
  })
  evidenceLinks: IncidentEvidenceLink[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
