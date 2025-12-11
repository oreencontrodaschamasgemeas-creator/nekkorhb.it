import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { SCOPES_KEY } from '../decorators/scopes.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  handleRequest(err: unknown, user: any, info: unknown, context: ExecutionContext) {
    const authenticatedUser = super.handleRequest(err, user, info, context);
    this.assertScopes(context, authenticatedUser);
    return authenticatedUser;
  }

  private assertScopes(context: ExecutionContext, user: any) {
    const requiredScopes = this.reflector.getAllAndOverride<string[] | undefined>(SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredScopes || requiredScopes.length === 0) {
      return;
    }

    const normalizedScopes = Array.isArray(user?.scopes)
      ? user.scopes
      : typeof user?.scope === 'string'
        ? user.scope.split(' ').filter(Boolean)
        : [];

    const hasAllRequiredScopes = requiredScopes.every((scope) => normalizedScopes.includes(scope));

    if (!hasAllRequiredScopes) {
      throw new ForbiddenException('Insufficient scope to access this resource');
    }
  }
}
