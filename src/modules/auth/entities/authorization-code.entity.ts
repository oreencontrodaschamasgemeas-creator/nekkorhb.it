import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { OAuthClient } from './oauth-client.entity';

@Entity('authorization_codes')
export class AuthorizationCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_authorization_code', { unique: true })
  @Column({ unique: true })
  code: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => OAuthClient, { onDelete: 'CASCADE' })
  client: OAuthClient;

  @Column()
  clientId: string;

  @Column({ type: 'simple-array', nullable: true })
  scopes?: string[];

  @Column({ nullable: true })
  redirectUri?: string;

  @Column({ nullable: true })
  codeChallenge?: string;

  @Column({ nullable: true })
  codeChallengeMethod?: string;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  consumed: boolean;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
