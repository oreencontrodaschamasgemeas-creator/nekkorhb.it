import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { OAuthClient } from './oauth-client.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_refresh_tokens_token_hash', { unique: true })
  @Column({ unique: true })
  tokenHash: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => OAuthClient, (client) => client.refreshTokens, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  client?: OAuthClient;

  @Column({ nullable: true })
  clientId?: string;

  @Column({ type: 'simple-array', nullable: true })
  scopes?: string[];

  @Column({ nullable: true })
  fingerprint?: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  revoked: boolean;

  @Column({ nullable: true })
  revokedReason?: string;

  @Column({ nullable: true })
  replacedByTokenId?: string;

  @Column({ nullable: true })
  rotatedFromTokenId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
