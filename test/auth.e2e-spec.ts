import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/modules/auth/auth.module';
import { User } from '../src/modules/auth/entities/user.entity';
import { OAuthClient } from '../src/modules/auth/entities/oauth-client.entity';
import { AuthorizationCode } from '../src/modules/auth/entities/authorization-code.entity';
import { RefreshToken } from '../src/modules/auth/entities/refresh-token.entity';
import { AuthAuditEvent } from '../src/modules/auth/entities/auth-audit-event.entity';

describe('Authentication flows (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          synchronize: true,
          entities: [User, OAuthClient, AuthorizationCode, RefreshToken, AuthAuditEvent],
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers, logs in, refreshes tokens and blocks reuse', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'integration@example.com',
        password: 'Passw0rd!',
        firstName: 'Integration',
        lastName: 'User',
        tenantId: 'tenant-test',
        buildingId: 'building-test',
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'integration@example.com',
        password: 'Passw0rd!',
        clientId: 'dashboard-client',
        clientSecret: 'dashboard-secret',
        scope: 'devices:read profile:read',
      })
      .expect(200);

    expect(loginResponse.body.access_token).toBeDefined();
    expect(loginResponse.body.refresh_token).toBeDefined();

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/token')
      .send({
        grant_type: 'refresh_token',
        refresh_token: loginResponse.body.refresh_token,
        client_id: 'dashboard-client',
        client_secret: 'dashboard-secret',
      })
      .expect(200);

    expect(refreshResponse.body.refresh_token).toBeDefined();
    expect(refreshResponse.body.refresh_token).not.toEqual(loginResponse.body.refresh_token);

    await request(app.getHttpServer())
      .post('/auth/token')
      .send({
        grant_type: 'refresh_token',
        refresh_token: loginResponse.body.refresh_token,
        client_id: 'dashboard-client',
        client_secret: 'dashboard-secret',
      })
      .expect(401);
  });
});
