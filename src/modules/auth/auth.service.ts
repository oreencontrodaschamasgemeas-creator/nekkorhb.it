import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OAuthClient } from './entities/oauth-client.entity';
import { AuthorizationCode } from './entities/authorization-code.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { ROLE_SCOPE_MAP, parseScopeString } from './constants/scopes.constant';
import { TokenRequestDto, TokenGrantType } from './dto/token-request.dto';
import { TokenService } from './services/token.service';
import { AuthAuditService } from './services/auth-audit.service';
import { AuthAuditEventType } from './entities/auth-audit-event.entity';
import { LogoutDto } from './dto/logout.dto';
import { IntrospectDto } from './dto/introspect.dto';
import { AuthorizeDto } from './dto/authorize.dto';

interface RefreshTokenMetadata {
  fingerprint?: string;
  userAgent?: string;
  ipAddress?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
  refresh_token?: string;
  refresh_token_expires_in?: number;
}

@Injectable()
export class AuthService {
  private readonly refreshTokenTtlSeconds: number;
  private readonly authorizationCodeTtlSeconds = 5 * 60; // 5 minutes
  private readonly defaultClientId: string;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(OAuthClient)
    private readonly oauthClientRepository: Repository<OAuthClient>,
    @InjectRepository(AuthorizationCode)
    private readonly authorizationCodeRepository: Repository<AuthorizationCode>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly tokenService: TokenService,
    private readonly auditService: AuthAuditService,
    private readonly configService: ConfigService,
  ) {
    this.refreshTokenTtlSeconds = this.parseTtl(
      this.configService.get('JWT_REFRESH_TTL') ?? this.configService.get('JWT_REFRESH_TTL_DAYS'),
      60 * 60 * 24 * 7,
    );
    this.defaultClientId = this.configService.get('AUTH_DASHBOARD_CLIENT_ID') ?? 'dashboard-client';
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const { credentialMetadata, ipAddress, userAgent, password, ...profile } = registerDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.usersRepository.create({
      ...profile,
      password: hashedPassword,
      credentialMetadata: {
        ...(credentialMetadata ?? {}),
        registrationIp: ipAddress,
        registrationUserAgent: userAgent,
        createdAt: new Date().toISOString(),
      },
    });

    await this.usersRepository.save(user);
    return this.sanitizeUser(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password)) && user.isActive) {
      return this.sanitizeUser(user) as User;
    }

    return null;
  }

  async login(loginDto: LoginDto) {
    return this.passwordGrant({
      username: loginDto.email,
      password: loginDto.password,
      clientId: loginDto.clientId,
      clientSecret: loginDto.clientSecret,
      scope: loginDto.scope,
      fingerprint: loginDto.fingerprint,
      userAgent: loginDto.userAgent,
      ipAddress: loginDto.ipAddress,
    });
  }

  async authorize(dto: AuthorizeDto, requesterId: string) {
    const user = await this.usersRepository.findOne({ where: { id: requesterId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const client = await this.resolveClient(dto.clientId, undefined, TokenGrantType.AUTHORIZATION_CODE, false);

    if (dto.redirectUri && client.redirectUris?.length && !client.redirectUris.includes(dto.redirectUri)) {
      throw new ForbiddenException('Redirect URI is not registered for this client');
    }

    const scopes = this.resolveScopes(user, client, dto.scope);

    const authorizationCode = randomBytes(32).toString('base64url');
    const codeEntity = this.authorizationCodeRepository.create({
      code: authorizationCode,
      user,
      userId: user.id,
      client,
      clientId: client.clientId,
      scopes,
      redirectUri: dto.redirectUri,
      codeChallenge: dto.codeChallenge,
      codeChallengeMethod: dto.codeChallengeMethod,
      expiresAt: new Date(Date.now() + this.authorizationCodeTtlSeconds * 1000),
      metadata: {
        state: dto.state,
      },
    });

    await this.authorizationCodeRepository.save(codeEntity);

    return {
      code: authorizationCode,
      state: dto.state,
      expires_in: this.authorizationCodeTtlSeconds,
    };
  }

  async token(tokenDto: TokenRequestDto) {
    switch (tokenDto.grantType) {
      case TokenGrantType.PASSWORD:
        return this.passwordGrant({
          username: tokenDto.username,
          password: tokenDto.password,
          clientId: tokenDto.clientId,
          clientSecret: tokenDto.clientSecret,
          scope: tokenDto.scope,
          fingerprint: tokenDto.fingerprint,
          userAgent: tokenDto.userAgent,
          ipAddress: tokenDto.ipAddress,
        });
      case TokenGrantType.CLIENT_CREDENTIALS:
        return this.clientCredentialsGrant(tokenDto);
      case TokenGrantType.AUTHORIZATION_CODE:
        return this.authorizationCodeGrant(tokenDto);
      case TokenGrantType.REFRESH_TOKEN:
        return this.refreshGrant(tokenDto);
      default:
        throw new BadRequestException('Unsupported grant type');
    }
  }

  async logout(userId: string, dto: LogoutDto) {
    const tokenHash = this.hashToken(dto.refreshToken);
    const token = await this.refreshTokenRepository.findOne({ where: { tokenHash } });

    if (!token || token.userId !== userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    token.revoked = true;
    token.revokedReason = 'logout';
    await this.refreshTokenRepository.save(token);
    await this.auditService.log(AuthAuditEventType.TOKEN_REVOKED, true, {
      userId,
      clientId: token.clientId,
    });

    return { success: true };
  }

  async introspect(dto: IntrospectDto) {
    try {
      const payload = await this.tokenService.verifyAccessToken(dto.token);
      const scopes = parseScopeString(payload.scope ?? payload.scopes);
      await this.auditService.log(AuthAuditEventType.TOKEN_INTROSPECTED, true, {
        userId: payload.sub,
        clientId: payload.clientId,
      });
      return {
        active: true,
        sub: payload.sub,
        scope: scopes.join(' '),
        exp: payload.exp,
        client_id: payload.clientId,
        tenant_id: payload.tenantId,
        building_id: payload.buildingId,
        role: payload.role,
      };
    } catch (error) {
      await this.auditService.log(AuthAuditEventType.TOKEN_INTROSPECTED, false, {
        reason: 'invalid_token',
      });
      return { active: false };
    }
  }

  async getMetrics() {
    return {
      metrics: this.auditService.getMetrics(),
      recent: await this.auditService.recent(10),
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async verifyAccessToken(token: string, requiredScopes: string[] = []) {
    const payload = await this.tokenService.verifyAccessToken(token);
    const tokenScopes = parseScopeString(payload.scope ?? payload.scopes);

    if (requiredScopes.length && !requiredScopes.every((scope) => tokenScopes.includes(scope))) {
      throw new ForbiddenException('Insufficient scope');
    }

    return payload;
  }

  private async passwordGrant(options: {
    username?: string;
    password?: string;
    clientId?: string;
    clientSecret?: string;
    scope?: string;
  } & RefreshTokenMetadata) {
    if (!options.username || !options.password) {
      throw new BadRequestException('Username and password are required');
    }

    const user = await this.usersRepository.findOne({ where: { email: options.username } });
    if (!user) {
      await this.auditService.log(AuthAuditEventType.LOGIN_FAILURE, false, { userId: options.username });
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(options.password, user.password);

    if (!passwordMatches || !user.isActive) {
      await this.auditService.log(AuthAuditEventType.LOGIN_FAILURE, false, { userId: user.id });
      throw new UnauthorizedException('Invalid credentials');
    }

    const client = await this.resolveClient(options.clientId, options.clientSecret, TokenGrantType.PASSWORD);
    const scopes = this.resolveScopes(user, client, options.scope);

    const tokens = await this.issueUserTokens(user, client, scopes, {
      fingerprint: options.fingerprint,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    });

    await this.auditService.log(AuthAuditEventType.LOGIN_SUCCESS, true, {
      userId: user.id,
      clientId: client.clientId,
    });

    await this.usersRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    return tokens;
  }

  private async clientCredentialsGrant(tokenDto: TokenRequestDto) {
    const client = await this.resolveClient(tokenDto.clientId, tokenDto.clientSecret, TokenGrantType.CLIENT_CREDENTIALS);
    const requestedScopes = parseScopeString(tokenDto.scope);
    const clientScopes = client.scopes ?? [];
    const scopes = requestedScopes.length
      ? this.assertSubset(requestedScopes, clientScopes)
      : clientScopes;

    if (!scopes.length) {
      throw new ForbiddenException('Client does not have any scopes assigned');
    }

    const access = await this.tokenService.issueAccessToken({
      subject: client.clientId,
      clientId: client.clientId,
      role: 'client',
      scopes,
    });

    await this.auditService.log(AuthAuditEventType.TOKEN_ISSUED, true, {
      clientId: client.clientId,
      scopes,
    });

    return this.buildTokenResponse(access.accessToken, access.expiresIn, scopes);
  }

  private async authorizationCodeGrant(tokenDto: TokenRequestDto) {
    if (!tokenDto.code) {
      throw new BadRequestException('Authorization code is required');
    }

    const client = await this.resolveClient(tokenDto.clientId, tokenDto.clientSecret, TokenGrantType.AUTHORIZATION_CODE);

    const codeRecord = await this.authorizationCodeRepository.findOne({
      where: { code: tokenDto.code },
    });

    if (!codeRecord || codeRecord.clientId !== client.clientId) {
      throw new UnauthorizedException('Invalid authorization code');
    }

    if (codeRecord.consumed || codeRecord.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Authorization code has expired or already been used');
    }

    if (codeRecord.redirectUri && tokenDto.redirectUri && codeRecord.redirectUri !== tokenDto.redirectUri) {
      throw new ForbiddenException('Redirect URI mismatch');
    }

    if (codeRecord.codeChallenge) {
      if (!tokenDto.codeVerifier) {
        throw new BadRequestException('Code verifier required for PKCE-enabled flows');
      }
      this.verifyPkce(codeRecord, tokenDto.codeVerifier);
    }

    const user = await this.usersRepository.findOne({ where: { id: codeRecord.userId } });
    if (!user) {
      throw new UnauthorizedException('User not found for authorization code');
    }

    codeRecord.consumed = true;
    await this.authorizationCodeRepository.save(codeRecord);

    const tokens = await this.issueUserTokens(user, client, codeRecord.scopes ?? [], {
      fingerprint: tokenDto.fingerprint,
      ipAddress: tokenDto.ipAddress,
      userAgent: tokenDto.userAgent,
    });

    return tokens;
  }

  private async refreshGrant(tokenDto: TokenRequestDto) {
    if (!tokenDto.refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const client = await this.resolveClient(tokenDto.clientId, tokenDto.clientSecret, TokenGrantType.REFRESH_TOKEN);

    if (client.allowRefreshTokens === false) {
      throw new ForbiddenException('Client is not allowed to refresh tokens');
    }

    const tokenHash = this.hashToken(tokenDto.refreshToken);
    const storedToken = await this.refreshTokenRepository.findOne({ where: { tokenHash } });

    if (!storedToken || storedToken.revoked) {
      throw new UnauthorizedException('Refresh token is invalid or revoked');
    }

    if (storedToken.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (storedToken.clientId && storedToken.clientId !== client.clientId) {
      throw new UnauthorizedException('Refresh token does not belong to this client');
    }

    const user = await this.usersRepository.findOne({ where: { id: storedToken.userId } });
    if (!user) {
      throw new UnauthorizedException('User not found for refresh token');
    }

    const scopes = storedToken.scopes ?? [];
    const access = await this.tokenService.issueAccessToken({
      subject: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      buildingId: user.buildingId,
      clientId: client.clientId,
      scopes,
    });

    const newRefresh = await this.createRefreshToken(user, client, scopes, {
      fingerprint: tokenDto.fingerprint,
      ipAddress: tokenDto.ipAddress,
      userAgent: tokenDto.userAgent,
    });

    storedToken.revoked = true;
    storedToken.revokedReason = 'rotated';
    storedToken.replacedByTokenId = newRefresh.entity.id;
    await this.refreshTokenRepository.save(storedToken);

    await this.auditService.log(AuthAuditEventType.TOKEN_REFRESHED, true, {
      userId: user.id,
      clientId: client.clientId,
    });

    return this.buildTokenResponse(
      access.accessToken,
      access.expiresIn,
      scopes,
      newRefresh.token,
      newRefresh.expiresIn,
    );
  }

  private async issueUserTokens(
    user: User,
    client: OAuthClient,
    scopes: string[],
    metadata?: RefreshTokenMetadata,
  ): Promise<TokenResponse> {
    const access = await this.tokenService.issueAccessToken({
      subject: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      buildingId: user.buildingId,
      clientId: client.clientId,
      scopes,
    });

    let refreshToken: string | undefined;
    let refreshExpiresIn: number | undefined;

    if (client.allowRefreshTokens !== false) {
      const persisted = await this.createRefreshToken(user, client, scopes, metadata);
      refreshToken = persisted.token;
      refreshExpiresIn = persisted.expiresIn;
    }

    await this.auditService.log(AuthAuditEventType.TOKEN_ISSUED, true, {
      userId: user.id,
      clientId: client.clientId,
      scopes,
    });

    return this.buildTokenResponse(access.accessToken, access.expiresIn, scopes, refreshToken, refreshExpiresIn);
  }

  private async createRefreshToken(
    user: User,
    client: OAuthClient,
    scopes: string[],
    metadata?: RefreshTokenMetadata,
  ) {
    const tokenValue = randomBytes(64).toString('base64url');
    const tokenHash = this.hashToken(tokenValue);
    const fingerprint = this.createFingerprint(tokenValue, metadata?.fingerprint);

    const entity = this.refreshTokenRepository.create({
      user,
      userId: user.id,
      client,
      clientId: client?.clientId,
      tokenHash,
      scopes,
      fingerprint,
      metadata,
      expiresAt: new Date(Date.now() + this.refreshTokenTtlSeconds * 1000),
    });

    await this.refreshTokenRepository.save(entity);
    await this.updateUserFingerprints(user, fingerprint);

    return {
      token: tokenValue,
      expiresIn: this.refreshTokenTtlSeconds,
      entity,
    };
  }

  private async resolveClient(
    clientId?: string,
    clientSecret?: string,
    requiredGrant?: TokenGrantType,
    enforceSecret = true,
  ) {
    const resolvedClientId = clientId || this.defaultClientId;
    const client = await this.oauthClientRepository.findOne({ where: { clientId: resolvedClientId } });

    if (!client) {
      throw new UnauthorizedException('Unknown OAuth client');
    }

    if (requiredGrant && client.grants && client.grants.length && !client.grants.includes(requiredGrant)) {
      throw new ForbiddenException('Client not allowed to use this grant type');
    }

    if (client.isConfidential && enforceSecret) {
      if (!clientSecret) {
        throw new UnauthorizedException('Client secret is required for confidential clients');
      }

      const validSecret = await bcrypt.compare(clientSecret, client.clientSecretHash);
      if (!validSecret) {
        throw new UnauthorizedException('Invalid client secret');
      }
    }

    return client;
  }

  private resolveScopes(user: User, client: OAuthClient, requestedScope?: string) {
    const requested = parseScopeString(requestedScope);
    const roleScopes = ROLE_SCOPE_MAP[user.role] ?? [];
    const clientScopes = client.scopes?.length ? client.scopes : roleScopes;

    const allowedScopes = roleScopes.filter((scope) => clientScopes.includes(scope));

    if (!allowedScopes.length) {
      throw new ForbiddenException('User role is not allowed to access this client');
    }

    if (!requested.length) {
      return allowedScopes;
    }

    const invalid = requested.filter((scope) => !allowedScopes.includes(scope));
    if (invalid.length) {
      throw new ForbiddenException(`Requested scopes are not allowed: ${invalid.join(', ')}`);
    }

    return requested;
  }

  private assertSubset(requested: string[], allowed: string[]) {
    const invalid = requested.filter((scope) => !allowed.includes(scope));
    if (invalid.length) {
      throw new ForbiddenException(`Requested scopes are not allowed: ${invalid.join(', ')}`);
    }
    return requested;
  }

  private verifyPkce(code: AuthorizationCode, verifier: string) {
    if (code.codeChallengeMethod && code.codeChallengeMethod.toLowerCase() === 'plain') {
      if (verifier !== code.codeChallenge) {
        throw new UnauthorizedException('PKCE verification failed');
      }
      return;
    }

    const hashed = createHash('sha256').update(verifier).digest('base64url');
    if (hashed !== code.codeChallenge) {
      throw new UnauthorizedException('PKCE verification failed');
    }
  }

  private sanitizeUser(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshTokens, ...rest } = user;
    return rest;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private createFingerprint(token: string, provided?: string) {
    if (provided) {
      return provided;
    }
    return createHash('sha1').update(token).digest('hex');
  }

  private async updateUserFingerprints(user: User, fingerprint: string) {
    const existing = Array.isArray(user.refreshFingerprints) ? user.refreshFingerprints : [];
    const updated = [fingerprint, ...existing.filter((value) => value !== fingerprint)].slice(0, 5);
    await this.usersRepository.update(user.id, {
      refreshFingerprints: updated,
    });
  }

  private buildTokenResponse(
    accessToken: string,
    expiresIn: number,
    scopes: string[],
    refreshToken?: string,
    refreshTokenExpiresIn?: number,
  ): TokenResponse {
    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      scope: scopes.join(' '),
      refresh_token: refreshToken,
      refresh_token_expires_in: refreshTokenExpiresIn,
    };
  }

  private parseTtl(value: string | number | undefined, fallbackSeconds: number) {
    if (typeof value === 'number' && value > 0) {
      return value;
    }

    if (typeof value === 'string') {
      const match = value.trim().match(/^(\d+)([smhd])?$/i);
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
