import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Device } from '../../devices/entities/device.entity';

export enum AlertType {
  MOTION_DETECTED = 'motion_detected',
  ANOMALY_DETECTED = 'anomaly_detected',
  DOOR_OPENED = 'door_opened',
  ALARM_TRIGGERED = 'alarm_triggered',
  TAMPER_DETECTED = 'tamper_detected',
  BATTERY_LOW = 'battery_low',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('alerts')
@Index(['deviceId', 'createdAt'])
@Index(['type', 'status'])
@Index(['severity', 'status'])
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  deviceId: string;

  @ManyToOne(() => Device, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deviceId' })
  device: Device;

  @Column({
    type: 'enum',
    enum: AlertType,
  })
  type: AlertType;

  @Column({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.MEDIUM,
  })
  severity: AlertSeverity;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.OPEN,
  })
  status: AlertStatus;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  sensorEventId: string;

  @Column({ nullable: true })
  incidentId: string;

  @Column({ nullable: true })
  acknowledgedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
