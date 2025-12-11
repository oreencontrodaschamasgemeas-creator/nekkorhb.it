import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';

@Entity('oauth_clients')
export class OAuthClient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  clientId: string;

  @Column()
  name: string;

  @Column()
  clientSecretHash: string;

  @Column({ default: true })
  isConfidential: boolean;

  @Column({ default: true })
  allowRefreshTokens: boolean;

  @Column({ type: 'simple-array', nullable: true })
  redirectUris?: string[];

  @Column({ type: 'simple-array', nullable: true })
  grants?: string[];

  @Column({ type: 'simple-array', nullable: true })
  scopes?: string[];

  @Column({ nullable: true })
  tenantId?: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;

  @OneToMany(() => RefreshToken, (token) => token.client)
  refreshTokens: RefreshToken[];
}
