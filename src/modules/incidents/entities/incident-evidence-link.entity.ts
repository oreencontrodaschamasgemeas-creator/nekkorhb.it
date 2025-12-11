import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Incident } from './incident.entity';

export enum EvidenceType {
  CCTV_CLIP = 'cctv_clip',
  SENSOR_LOG = 'sensor_log',
  SYSTEM_LOG = 'system_log',
  ACCESS_LOG = 'access_log',
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  OTHER = 'other',
}

@Entity('incident_evidence_links')
@Index(['incidentId', 'type'])
export class IncidentEvidenceLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  incidentId: string;

  @ManyToOne(() => Incident, (incident) => incident.evidenceLinks, {
    onDelete: 'CASCADE',
  })
  incident: Incident;

  @Column({
    type: 'enum',
    enum: EvidenceType,
  })
  type: EvidenceType;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  mediaId: string;

  @Column({ type: 'timestamp', nullable: true })
  timestamp: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
