import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Device } from '../../devices/entities/device.entity';

export enum StreamStatus {
  IDLE = 'idle',
  STARTING = 'starting',
  ACTIVE = 'active',
  STOPPING = 'stopping',
  ERROR = 'error',
  RECONNECTING = 'reconnecting',
}

export enum StreamProtocol {
  RTSP = 'rtsp',
  ONVIF = 'onvif',
  HTTP = 'http',
}

export enum TranscodeFormat {
  WEBRTC = 'webrtc',
  HLS = 'hls',
  BOTH = 'both',
}

@Entity('camera_streams')
export class CameraStream {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  deviceId: string;

  @ManyToOne(() => Device, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deviceId' })
  device: Device;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: StreamProtocol,
  })
  protocol: StreamProtocol;

  @Column()
  sourceUrl: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  password: string;

  @Column({
    type: 'enum',
    enum: TranscodeFormat,
    default: TranscodeFormat.BOTH,
  })
  transcodeFormat: TranscodeFormat;

  @Column({
    type: 'enum',
    enum: StreamStatus,
    default: StreamStatus.IDLE,
  })
  status: StreamStatus;

  @Column({ nullable: true })
  webrtcUrl: string;

  @Column({ nullable: true })
  hlsUrl: string;

  @Column({ default: false })
  isRecording: boolean;

  @Column({ type: 'int', default: 0 })
  reconnectAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lastHealthCheck: Date;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
