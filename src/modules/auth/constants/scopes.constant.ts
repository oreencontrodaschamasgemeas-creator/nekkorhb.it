import { UserRole } from '../entities/user.entity';

export enum AuthScope {
  PROFILE_READ = 'profile:read',
  AUTH_AUTHORIZE = 'auth:authorize',
  AUTH_INTROSPECT = 'auth:introspect',
  AUTH_METRICS = 'auth:metrics',
  ADMIN_READ = 'admin:read',
  ADMIN_WRITE = 'admin:write',
  DEVICES_READ = 'devices:read',
  DEVICES_WRITE = 'devices:write',
  MONITORING_READ = 'monitoring:read',
  MONITORING_WRITE = 'monitoring:write',
  INCIDENTS_READ = 'incidents:read',
  INCIDENTS_WRITE = 'incidents:write',
  NOTIFICATIONS_READ = 'notifications:read',
  NOTIFICATIONS_WRITE = 'notifications:write',
  REALTIME_CONNECT = 'realtime:connect',
}

const sharedReadScopes = [
  AuthScope.PROFILE_READ,
  AuthScope.DEVICES_READ,
  AuthScope.MONITORING_READ,
  AuthScope.INCIDENTS_READ,
  AuthScope.NOTIFICATIONS_READ,
  AuthScope.REALTIME_CONNECT,
];

const operatorWriteScopes = [
  AuthScope.DEVICES_WRITE,
  AuthScope.MONITORING_WRITE,
  AuthScope.INCIDENTS_WRITE,
  AuthScope.NOTIFICATIONS_WRITE,
];

export const ROLE_SCOPE_MAP: Record<UserRole, AuthScope[]> = {
  [UserRole.ADMIN]: Object.values(AuthScope),
  [UserRole.OPERATOR]: [...sharedReadScopes, ...operatorWriteScopes],
  [UserRole.USER]: sharedReadScopes,
};

export const parseScopeString = (scope?: string | string[]): string[] => {
  if (!scope) {
    return [];
  }

  if (Array.isArray(scope)) {
    return scope;
  }

  return scope
    .split(' ')
    .map((value) => value.trim())
    .filter(Boolean);
};
