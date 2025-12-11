import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { TokenService } from './token.service';
import { SecretManagerService } from './secret-manager.service';

describe('TokenService', () => {
  let tokenService: TokenService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), JwtModule.register({})],
      providers: [SecretManagerService, TokenService],
    }).compile();

    tokenService = moduleRef.get(TokenService);
  });

  it('issues RS256 tokens and verifies payload', async () => {
    const result = await tokenService.issueAccessToken({
      subject: 'user-123',
      email: 'user@example.com',
      role: 'admin',
      tenantId: 'tenant-1',
      buildingId: 'building-42',
      clientId: 'dashboard-client',
      scopes: ['devices:read', 'profile:read'],
    });

    expect(result.accessToken).toBeDefined();
    expect(result.expiresIn).toBeGreaterThan(0);

    const payload = await tokenService.verifyAccessToken(result.accessToken);
    expect(payload.sub).toEqual('user-123');
    expect(payload.scope).toContain('devices:read');
    expect(payload.clientId).toEqual('dashboard-client');
  });

  it('rejects invalid tokens', async () => {
    await expect(tokenService.verifyAccessToken('invalid.token.value')).rejects.toBeDefined();
  });
});
