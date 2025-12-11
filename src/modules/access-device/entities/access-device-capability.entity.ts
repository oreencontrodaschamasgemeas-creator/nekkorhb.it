import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { AccessDevice } from './access-device.entity';

@Entity('access_device_capabilities')
export class AccessDeviceCapability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AccessDevice, (device) => device.capabilities, {
    onDelete: 'CASCADE',
  })
  device: AccessDevice;

  @Column()
  deviceId: string;

  @Column()
  capability: string;

  @Column({ type: 'jsonb', nullable: true })
  parameters: Record<string, any>;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
