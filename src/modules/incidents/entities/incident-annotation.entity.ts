import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Incident } from './incident.entity';

@Entity('incident_annotations')
@Index(['incidentId', 'createdAt'])
export class IncidentAnnotation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  incidentId: string;

  @ManyToOne(() => Incident, (incident) => incident.annotations, {
    onDelete: 'CASCADE',
  })
  incident: Incident;

  @Column()
  userId: string;

  @Column('text')
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
