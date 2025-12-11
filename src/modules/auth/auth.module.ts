import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { OAuthClient } from './entities/oauth-client.entity';
import { AuthorizationCode } from './entities/authorization-code.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuthAuditEvent } from './entities/auth-audit-event.entity';
import { SecretManagerService } from './services/secret-manager.service';
import { TokenService } from './services/token.service';
import { AuthAuditService } from './services/auth-audit.service';
import { AuthBootstrapService } from './services/auth-bootstrap.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OAuthClient, AuthorizationCode, RefreshToken, AuthAuditEvent]),
    PassportModule,
    JwtModule.register({
      signOptions: {
        algorithm: 'RS256',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    SecretManagerService,
    TokenService,
    AuthAuditService,
    AuthBootstrapService,
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
