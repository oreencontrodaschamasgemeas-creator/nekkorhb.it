import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AccessRuleAction {
  GRANT = 'grant',
  DENY = 'deny',
}

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

@Entity('access_rules')
export class AccessRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  zone: string;

  @Column({
    type: 'enum',
    enum: AccessRuleAction,
    default: AccessRuleAction.DENY,
  })
  action: AccessRuleAction;

  @Column({ type: 'time', nullable: true })
  startTime: string;

  @Column({ type: 'time', nullable: true })
  endTime: string;

  @Column({ type: 'simple-array', nullable: true })
  allowedDays: string[];

  @Column({ type: 'date', nullable: true })
  effectiveFrom: Date;

  @Column({ type: 'date', nullable: true })
  effectiveUntil: Date;

  @Column({ type: 'simple-array', default: '[]' })
  requireMultiFactor: string[];

  @Column({ type: 'simple-array', nullable: true })
  allowedCredentialTypes: string[];

  @Column({ type: 'simple-array', nullable: true })
  allowedDeviceIds: string[];

  @Column({ nullable: true })
  maxDailyAttempts: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
