import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SecretManagerService } from './secret-manager.service';

export interface IssueAccessTokenParams {
  subject: string;
  email?: string;
  role?: string;
  tenantId?: string;
  buildingId?: string;
  clientId?: string;
  scopes: string[];
  audience?: string;
}

export interface AccessTokenVerificationResult {
  sub: string;
  email?: string;
  role?: string;
  scope?: string;
  scopes?: string[];
  tenantId?: string;
  buildingId?: string;
  clientId?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly secretManager: SecretManagerService,
    private readonly configService: ConfigService,
  ) {}

  async issueAccessToken(params: IssueAccessTokenParams): Promise<{ accessToken: string; expiresIn: number }> {
    const ttlSeconds = this.resolveAccessTokenTtl();
    const signingKey = await this.secretManager.getActiveKeyPair();

    const accessToken = this.jwtService.sign(
      {
        sub: params.subject,
        email: params.email,
        role: params.role,
        tenantId: params.tenantId,
        buildingId: params.buildingId,
        clientId: params.clientId,
        scope: (params.scopes || []).join(' '),
      },
      {
        algorithm: 'RS256',
        keyid: signingKey.kid,
        privateKey: signingKey.privateKey,
        expiresIn: `${ttlSeconds}s`,
        audience: params.audience,
        subject: params.subject,
      },
    );

    return { accessToken, expiresIn: ttlSeconds };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenVerificationResult> {
    const decoded: any = this.jwtService.decode(token, { complete: true });
    const kid = decoded?.header?.kid;
    const publicKey = await this.secretManager.getPublicKey(kid);
    return this.jwtService.verify(token, {
      algorithms: ['RS256'],
      secret: publicKey,
    }) as AccessTokenVerificationResult;
  }

  private resolveAccessTokenTtl(): number {
    const configured = this.configService.get<string>('JWT_ACCESS_TTL') ?? this.configService.get<string>('JWT_EXPIRES_IN');
    return this.parseTtl(configured, 15 * 60);
  }

  private parseTtl(value: string | number | undefined, fallbackSeconds: number): number {
    if (typeof value === 'number' && !Number.isNaN(value) && value > 0) {
      return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const trimmed = value.trim();
      const match = trimmed.match(/^(\d+)([smhd])?$/i);
      if (match) {
        const amount = parseInt(match[1], 10);
        const unit = match[2]?.toLowerCase() ?? 's';
        const unitMap: Record<string, number> = {
          s: 1,
          m: 60,
          h: 60 * 60,
          d: 60 * 60 * 24,
        };
        return amount * (unitMap[unit] || 1);
      }
    }

    return fallbackSeconds;
  }
}
