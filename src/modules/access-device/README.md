# Access Device Control Module

A comprehensive physical access control system handling RFID, biometrics, and PIN codes with hardware abstraction, device registry, validation service, and WebSocket support.

## Features

### 1. Hardware Abstraction Layer (HAL)
- **Device Registry**: Centralized management of all access control devices
- **Device Capabilities**: Track hardware capabilities, firmware versions, and network status
- **Adapter Pattern**: Modular adapters for different credential types

### 2. Credential Type Adapters
- **RFID Adapter**: Wiegand (26/34-bit) and OSDP protocol support
- **Biometrics Adapter**: Fingerprint, face recognition, and iris scanning
- **Keypad Adapter**: PIN code entry validation

### 3. Access Validation Engine
- **Rule-Based Access Control**: Time windows, zones, and multi-factor requirements
- **SLA Compliance**: <200ms response time guarantee
- **Audit Logging**: Complete audit trail of all access attempts

### 4. WebSocket Real-Time Events
- Device status notifications
- Access validation results
- Tamper and offline alerts
- Zone-based broadcasting

### 5. Security Features
- Multi-factor authentication support
- Time-based access windows
- Daily attempt limits
- Tamper detection
- Degraded mode operations

## Architecture

```
AccessDeviceModule
├── Entities
│   ├── AccessDevice
│   ├── AccessDeviceCapability
│   ├── AccessRule
│   └── AccessAuditLog
├── Services
│   ├── AccessDeviceService (orchestration)
│   ├── DeviceRegistryService (device management)
│   ├── CredentialValidationService (validation logic)
│   ├── AccessRuleService (rule management)
│   └── AccessAuditService (audit logging)
├── Adapters
│   ├── RfidAdapter
│   ├── BiometricsAdapter
│   ├── KeypadAdapter
│   └── HardwareAdapterFactory
├── Controllers
│   └── AccessDeviceController (REST API)
├── Gateways
│   └── AccessDeviceGateway (WebSocket)
└── DTOs
    ├── RegisterAccessDeviceDto
    ├── ValidateCredentialDto
    ├── CreateAccessRuleDto
    └── ValidationResponseDto
```

## API Endpoints

### Device Management

#### Register Device
```
POST /access-device/devices/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Main Entrance RFID",
  "serialNumber": "RFID-SN-001",
  "deviceId": "device-001",
  "type": "rfid_reader",
  "firmware": "1.2.3",
  "location": "Building A, Floor 1",
  "zone": "entrance",
  "ipAddresses": ["192.168.1.100"],
  "supportedCredentialTypes": ["rfid", "wiegand"]
}
```

#### Get All Devices
```
GET /access-device/devices
Authorization: Bearer <token>
```

#### Get Device by ID
```
GET /access-device/devices/{deviceId}
Authorization: Bearer <token>
```

#### Get Devices by Zone
```
GET /access-device/devices/zone/{zone}
Authorization: Bearer <token>
```

#### Get Online Devices
```
GET /access-device/devices/status/online
Authorization: Bearer <token>
```

### Credential Validation

#### Validate Credential (Synchronous)
```
POST /access-device/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-123",
  "deviceId": "device-001",
  "credentialType": "rfid",
  "credential": "AABBCCDD",
  "zone": "entrance",
  "metadata": {
    "confidence": 0.95,
    "factors": ["rfid", "fingerprint"]
  }
}

Response:
{
  "auditLogId": "log-uuid",
  "userId": "user-123",
  "deviceId": "device-001",
  "decision": "granted",
  "denyReason": null,
  "credentialType": "rfid",
  "responseTimeMs": 45,
  "ruleId": "rule-uuid",
  "appliedFactors": ["rfid", "fingerprint"],
  "message": "Access granted",
  "metadata": {
    "slaCompliant": true
  }
}
```

#### Validate Credential (Asynchronous)
```
POST /access-device/validate/async
Authorization: Bearer <token>

Response:
{
  "jobId": "job-123"
}
```

### Access Rules

#### Create Rule
```
POST /access-device/rules
Authorization: Bearer <token>

{
  "userId": "user-123",
  "zone": "entrance",
  "action": "grant",
  "startTime": "09:00:00",
  "endTime": "17:00:00",
  "allowedDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "allowedCredentialTypes": ["rfid", "wiegand"],
  "allowedDeviceIds": ["device-001"],
  "requireMultiFactor": ["fingerprint"],
  "maxDailyAttempts": 100
}
```

#### Get Rules for User
```
GET /access-device/rules/user/{userId}
Authorization: Bearer <token>
```

#### Get Rule Details
```
GET /access-device/rules/{ruleId}
Authorization: Bearer <token>
```

#### Update Rule
```
PATCH /access-device/rules/{ruleId}
Authorization: Bearer <token>

{
  "startTime": "08:00:00",
  "endTime": "18:00:00"
}
```

#### Disable Rule
```
POST /access-device/rules/{ruleId}/disable
Authorization: Bearer <token>
```

#### Enable Rule
```
POST /access-device/rules/{ruleId}/enable
Authorization: Bearer <token>
```

#### Delete Rule
```
DELETE /access-device/rules/{ruleId}
Authorization: Bearer <token>
```

## WebSocket Events

### Client -> Server

#### Validate Credential
```javascript
socket.emit('validate-credential', {
  userId: 'user-123',
  deviceId: 'device-001',
  credentialType: 'rfid',
  credential: 'AABBCCDD',
  zone: 'entrance'
});
```

#### Subscribe to Device Events
```javascript
socket.emit('subscribe-device', { deviceId: 'device-001' });
socket.emit('unsubscribe-device', { deviceId: 'device-001' });
```

#### Subscribe to Zone Events
```javascript
socket.emit('subscribe-zone', { zone: 'entrance' });
```

#### Subscribe to User Events
```javascript
socket.emit('subscribe-user', { userId: 'user-123' });
```

#### Subscribe to Denied Access Events
```javascript
socket.emit('subscribe-denied-access');
```

### Server -> Client

#### Validation Result
```javascript
socket.on('validation-result', (data) => {
  // {
  //   auditLogId: string,
  //   userId: string,
  //   deviceId: string,
  //   decision: 'granted' | 'denied' | 'error',
  //   denyReason?: string,
  //   responseTimeMs: number,
  //   ...
  // }
});
```

#### Access Validation Event
```javascript
socket.on('access-validation', (data) => {
  // Broadcasts to subscribed device/user rooms
});
```

#### Denied Access Notification
```javascript
socket.on('access-denied', (data) => {
  // Broadcasts to security center
});
```

#### Device Status Events
```javascript
socket.on('device-online', { deviceId, timestamp });
socket.on('device-offline', { deviceId, timestamp, reason });
socket.on('device-tampered', { deviceId, timestamp });
```

## Validation Flow

1. **Device Validation**
   - Check device exists and is online
   - Mark device offline if threshold exceeded

2. **Credential Parsing**
   - Route to appropriate adapter (RFID/Biometric/PIN)
   - Extract credential ID

3. **Rule Matching**
   - Find applicable rules for user
   - Evaluate rule conditions:
     - Time window (start/end time)
     - Day of week restrictions
     - Effective date range
     - Credential type allowed
     - Device allowed

4. **Multi-Factor Check**
   - Verify all required factors provided
   - Check confidence scores

5. **Decision & Logging**
   - Grant or deny access
   - Create audit log
   - Broadcast via WebSocket
   - Update device metrics

## Access Decision Reasons

### Granted
- Access allowed based on matching rule

### Denied
- **NO_RULE**: No matching grant rule found
- **OUTSIDE_TIME_WINDOW**: Current time outside allowed window
- **INVALID_ZONE**: Device zone not in allowed zones
- **MULTI_FACTOR_REQUIRED**: Multi-factor required but not provided
- **MULTI_FACTOR_FAILED**: Not all required factors provided
- **CREDENTIAL_REVOKED**: Credential no longer valid
- **DAILY_LIMIT_EXCEEDED**: User exceeded max daily attempts
- **DEVICE_OFFLINE**: Device is not online
- **SYSTEM_ERROR**: Internal system error
- **TAMPER_DETECTED**: Device tamper detected
- **INVALID_CREDENTIAL**: Credential format invalid

## Device Status Management

### Device Lifecycle
1. **Registered**: Device registered but offline
2. **Online**: Device connected and responding
3. **Offline**: Connection lost or health check failed
4. **Maintenance**: Device in maintenance mode
5. **Tampered**: Tamper detection triggered

### Automatic Status Updates
- Failed attempts counter increments on each failed validation
- After 10+ failures, device automatically marked offline
- Successful validation decrements failure counter
- Last seen timestamp updated on each successful validation

## Audit Logging

All access attempts are logged with:
- User ID
- Device ID
- Zone
- Access decision (granted/denied/error)
- Reason for denial
- Credential type used
- Response time
- Applied authentication factors
- Custom metadata

### Audit Queries
```typescript
// Get logs for user
await auditService.getLogsForUser('user-123', limit: 100, offset: 0);

// Get logs for device
await auditService.getLogsForDevice('device-001', limit: 100, offset: 0);

// Get denied access logs
await auditService.getDeniedAccessLogs(limit: 100, offset: 0);

// Get security metrics
await auditService.getSecurityMetrics(startDate, endDate);
```

## SLA Compliance

Response time guarantee: **< 200ms**

The validation service measures end-to-end response time including:
- Device lookup and status check
- Rule evaluation
- Credential validation
- Audit logging
- WebSocket broadcast

SLA compliance is indicated in the response:
```json
{
  "metadata": {
    "slaCompliant": true
  }
}
```

## Multi-Factor Authentication

Rules can require multiple authentication factors:

```typescript
const rule = {
  userId: 'user-123',
  requireMultiFactor: ['rfid', 'fingerprint'],
  allowedCredentialTypes: ['rfid', 'fingerprint']
};
```

Validation must provide all required factors:
```typescript
const validation = {
  userId: 'user-123',
  deviceId: 'device-001',
  credentialType: 'rfid',
  credential: 'AABBCCDD',
  metadata: {
    factors: ['rfid', 'fingerprint']
  }
};
```

## Error Handling

### Device Not Found
Returns 400 Bad Request with error message

### Device Offline
Returns 503 Service Unavailable
Automatically attempts degraded mode if configured

### Invalid Credential Format
Returns validation error in response
Logs error to audit trail

### System Errors
Returns error decision in response
Full audit trail maintained
Alert broadcast to security center

## Testing

### Unit Tests
```bash
npm test -- access-device
```

### E2E Tests
```bash
npm run test:e2e -- access-device
```

### Test Coverage
- Device registry: registration, status updates, queries
- Credential validation: all decision paths
- Hardware adapters: credential parsing and validation
- Access rules: time window evaluation, multi-factor checks
- WebSocket: event broadcasting and subscription

## Configuration

Environment variables:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=access_control
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret
NODE_ENV=development
```

## Performance Optimization

1. **Caching**: Device and rule caches for frequent lookups
2. **Connection Pooling**: Database connection optimization
3. **Async Validation**: Optional queue-based async processing
4. **WebSocket Broadcasting**: Optimized room-based messaging
5. **Index Optimization**: Database indexes on audit logs

## Security Considerations

1. **Credential Security**: Credentials never logged in plaintext
2. **Audit Trail**: Immutable audit logs for compliance
3. **Time-based Access**: Prevents unauthorized off-hours access
4. **Multi-Factor**: Defense against single-factor compromise
5. **Device Verification**: Validates device legitimacy before accepting credentials

## Future Enhancements

- [ ] Credential revocation lists (CRL)
- [ ] Biometric template encryption
- [ ] Device firmware update automation
- [ ] Visitor access management
- [ ] Access reports and analytics dashboard
- [ ] Scheduled access grants
- [ ] Role-based access delegation
- [ ] Geo-fencing integration
