import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Device } from '../../devices/entities/device.entity';

export enum SensorEventType {
  MOTION = 'motion',
  DOOR = 'door',
  ALARM = 'alarm',
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  TAMPER = 'tamper',
  BATTERY_LOW = 'battery_low',
}

export enum SensorEventStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  ELEVATED = 'elevated',
  IGNORED = 'ignored',
}

@Entity('sensor_events')
@Index(['deviceId', 'timestamp'])
@Index(['type', 'timestamp'])
@Index(['status', 'timestamp'])
export class SensorEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  deviceId: string;

  @ManyToOne(() => Device, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deviceId' })
  device: Device;

  @Column({
    type: 'enum',
    enum: SensorEventType,
  })
  type: SensorEventType;

  @Column()
  value: string;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'timestamp' })
  normalizedTimestamp: Date;

  @Column({
    type: 'enum',
    enum: SensorEventStatus,
    default: SensorEventStatus.PENDING,
  })
  status: SensorEventStatus;

  @Column({ nullable: true })
  alertId: string;

  @Column({ type: 'jsonb', nullable: true })
  rawData: Record<string, any>;

  @Column({ nullable: true })
  deduplicationKey: string;

  @CreateDateColumn()
  createdAt: Date;
}
