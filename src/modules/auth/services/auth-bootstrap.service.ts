import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { OAuthClient } from '../entities/oauth-client.entity';
import { ConfigService } from '@nestjs/config';
import { AuthScope } from '../constants/scopes.constant';

interface ClientSeedConfig {
  clientId: string;
  secret: string;
  name: string;
  grants: string[];
  scopes: string[];
  redirectUris: string[];
  isConfidential: boolean;
  allowRefreshTokens?: boolean;
}

@Injectable()
export class AuthBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AuthBootstrapService.name);

  constructor(
    @InjectRepository(OAuthClient)
    private readonly oauthClientRepository: Repository<OAuthClient>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultClients();
  }

  private async ensureDefaultClients() {
    const defaults: ClientSeedConfig[] = [
      {
        clientId: this.configService.get('AUTH_DASHBOARD_CLIENT_ID') ?? 'dashboard-client',
        secret: this.configService.get('AUTH_DASHBOARD_CLIENT_SECRET') ?? 'dashboard-secret',
        name: 'Dashboard',
        grants: ['authorization_code', 'password', 'refresh_token'],
        scopes: Object.values(AuthScope),
        redirectUris: [this.configService.get('AUTH_DASHBOARD_REDIRECT_URI') ?? 'http://localhost:3000/oauth/callback'],
        isConfidential: true,
      },
      {
        clientId: this.configService.get('AUTH_MOBILE_CLIENT_ID') ?? 'mobile-client',
        secret: this.configService.get('AUTH_MOBILE_CLIENT_SECRET') ?? 'mobile-secret',
        name: 'Mobile',
        grants: ['authorization_code', 'password', 'refresh_token'],
        scopes: [
          AuthScope.PROFILE_READ,
          AuthScope.DEVICES_READ,
          AuthScope.MONITORING_READ,
          AuthScope.INCIDENTS_READ,
          AuthScope.NOTIFICATIONS_READ,
          AuthScope.REALTIME_CONNECT,
        ],
        redirectUris: [this.configService.get('AUTH_MOBILE_REDIRECT_URI') ?? 'mobile://oauth/callback'],
        isConfidential: false,
      },
      {
        clientId: this.configService.get('AUTH_PARTNER_CLIENT_ID') ?? 'partner-client',
        secret: this.configService.get('AUTH_PARTNER_CLIENT_SECRET') ?? 'partner-secret',
        name: 'Partner Integrations',
        grants: ['client_credentials'],
        scopes: [
          AuthScope.DEVICES_READ,
          AuthScope.MONITORING_READ,
          AuthScope.INCIDENTS_READ,
          AuthScope.NOTIFICATIONS_READ,
        ],
        redirectUris: [],
        isConfidential: true,
        allowRefreshTokens: false,
      },
    ];

    for (const client of defaults) {
      await this.ensureClient(client);
    }
  }

  private async ensureClient(seed: ClientSeedConfig) {
    const existing = await this.oauthClientRepository.findOne({ where: { clientId: seed.clientId } });
    if (existing) {
      return;
    }

    const clientSecretHash = await bcrypt.hash(seed.secret, 10);

    const client = this.oauthClientRepository.create({
      clientId: seed.clientId,
      name: seed.name,
      clientSecretHash,
      isConfidential: seed.isConfidential,
      allowRefreshTokens: seed.allowRefreshTokens ?? true,
      grants: seed.grants,
      scopes: seed.scopes,
      redirectUris: seed.redirectUris,
    });

    await this.oauthClientRepository.save(client);
    this.logger.log(`Provisioned OAuth client ${seed.clientId}`);
  }
}
