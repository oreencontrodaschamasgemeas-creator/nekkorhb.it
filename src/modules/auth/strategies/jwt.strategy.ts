import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { decode } from 'jsonwebtoken';
import { SecretManagerService } from '../services/secret-manager.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly secretManager: SecretManagerService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      secretOrKeyProvider: async (_request, rawJwtToken, done) => {
        try {
          const decoded: any = decode(rawJwtToken, { complete: true });
          const kid = decoded?.header?.kid;
          const key = await secretManager.getPublicKey(kid);
          done(null, key);
        } catch (error) {
          done(error as Error, null);
        }
      },
    });
  }

  async validate(payload: any) {
    const normalizedScopes = Array.isArray(payload.scopes)
      ? payload.scopes
      : typeof payload.scope === 'string'
        ? payload.scope.split(' ').filter(Boolean)
        : [];

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      scopes: normalizedScopes,
      tenantId: payload.tenantId,
      buildingId: payload.buildingId,
      clientId: payload.clientId,
    };
  }
}
