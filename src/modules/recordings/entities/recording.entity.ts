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
import { CameraStream } from '../../cctv/entities/camera-stream.entity';

export enum RecordingStatus {
  PENDING = 'pending',
  RECORDING = 'recording',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ARCHIVED = 'archived',
}

@Entity('recordings')
@Index(['cameraStreamId', 'startTime'])
@Index(['startTime', 'endTime'])
export class Recording {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  cameraStreamId: string;

  @ManyToOne(() => CameraStream, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cameraStreamId' })
  cameraStream: CameraStream;

  @Column({ nullable: true })
  incidentId: string;

  @Column()
  filename: string;

  @Column()
  storagePath: string;

  @Column({ nullable: true })
  storageUrl: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: RecordingStatus,
    default: RecordingStatus.PENDING,
  })
  status: RecordingStatus;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
