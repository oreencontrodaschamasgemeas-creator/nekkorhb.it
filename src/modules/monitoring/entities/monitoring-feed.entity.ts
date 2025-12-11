import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum FeedType {
  METRIC = 'metric',
  LOG = 'log',
  EVENT = 'event',
  ALERT = 'alert',
}

export enum FeedSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

@Entity('monitoring_feeds')
export class MonitoringFeed {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  deviceId: string;

  @Column({
    type: 'enum',
    enum: FeedType,
  })
  type: FeedType;

  @Column({
    type: 'enum',
    enum: FeedSeverity,
    default: FeedSeverity.INFO,
  })
  severity: FeedSeverity;

  @Column()
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @CreateDateColumn()
  timestamp: Date;
}
