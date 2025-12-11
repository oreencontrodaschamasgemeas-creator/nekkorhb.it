import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { AccessDeviceCapability } from './access-device-capability.entity';

export enum AccessDeviceType {
  RFID_READER = 'rfid_reader',
  BIOMETRIC_SCANNER = 'biometric_scanner',
  KEYPAD = 'keypad',
  MULTI_MODAL = 'multi_modal',
}

export enum AccessDeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  TAMPERED = 'tampered',
}

export enum BiometricType {
  FINGERPRINT = 'fingerprint',
  FACE = 'face',
  IRIS = 'iris',
}

@Entity('access_devices')
export class AccessDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  serialNumber: string;

  @Column({ unique: true })
  deviceId: string;

  @Column({
    type: 'enum',
    enum: AccessDeviceType,
  })
  type: AccessDeviceType;

  @Column({
    type: 'enum',
    enum: AccessDeviceStatus,
    default: AccessDeviceStatus.OFFLINE,
  })
  status: AccessDeviceStatus;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  zone: string;

  @Column()
  firmware: string;

  @Column({ nullable: true })
  model: string;

  @Column({ type: 'simple-array', default: '[]' })
  ipAddresses: string[];

  @Column({ type: 'jsonb', nullable: true })
  networkInfo: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  lastSeenAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastHealthCheckAt: Date;

  @Column({ default: 0 })
  failedAttempts: number;

  @Column({ type: 'simple-array', default: '[]' })
  supportedCredentialTypes: string[];

  @OneToMany(() => AccessDeviceCapability, (capability) => capability.device, {
    eager: true,
    cascade: true,
  })
  capabilities: AccessDeviceCapability[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
