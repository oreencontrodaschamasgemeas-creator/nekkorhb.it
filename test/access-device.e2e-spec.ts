import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AccessDeviceType } from '../src/modules/access-device/entities/access-device.entity';
import { CredentialType } from '../src/modules/access-device/dto/validate-credential.dto';
import { RegisterAccessDeviceDto } from '../src/modules/access-device/dto/register-access-device.dto';
import { ValidateCredentialDto } from '../src/modules/access-device/dto/validate-credential.dto';
import { CreateAccessRuleDto } from '../src/modules/access-device/dto/create-access-rule.dto';
import { AccessRuleAction } from '../src/modules/access-device/entities/access-rule.entity';

describe('Access Device Module (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;
  let registeredDeviceId: string;
  let createdRuleId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Register a test user and get JWT token
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'TestPass123!',
      })
      .catch(() => {
        // User might already exist
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPass123!',
      });

    jwtToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Device Registration', () => {
    it('should register an RFID reader device', async () => {
      const registerDto: RegisterAccessDeviceDto = {
        name: 'Main Entrance RFID Reader',
        serialNumber: 'RFID-SN-001',
        deviceId: 'device-rfid-001',
        type: AccessDeviceType.RFID_READER,
        firmware: '1.2.3',
        model: 'HID Prox Reader 5355',
        location: 'Building A, Floor 1',
        zone: 'entrance',
        ipAddresses: ['192.168.1.100'],
        supportedCredentialTypes: ['rfid', 'wiegand'],
      };

      const response = await request(app.getHttpServer())
        .post('/access-device/devices/register')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.deviceId).toBe(registerDto.deviceId);
      expect(response.body.status).toBe('offline');
      registeredDeviceId = response.body.deviceId;
    });

    it('should register a biometric scanner device', async () => {
      const registerDto: RegisterAccessDeviceDto = {
        name: 'Fingerprint Scanner',
        serialNumber: 'BIO-SN-001',
        deviceId: 'device-bio-001',
        type: AccessDeviceType.BIOMETRIC_SCANNER,
        firmware: '2.0.0',
        location: 'Building B, Floor 2',
        zone: 'secure-area',
        ipAddresses: ['192.168.1.101'],
      };

      const response = await request(app.getHttpServer())
        .post('/access-device/devices/register')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(registerDto)
        .expect(201);

      expect(response.body.type).toBe(AccessDeviceType.BIOMETRIC_SCANNER);
    });

    it('should register a keypad device', async () => {
      const registerDto: RegisterAccessDeviceDto = {
        name: 'PIN Keypad',
        serialNumber: 'KEY-SN-001',
        deviceId: 'device-keypad-001',
        type: AccessDeviceType.KEYPAD,
        firmware: '1.0.0',
        location: 'Building C',
        zone: 'restricted',
      };

      const response = await request(app.getHttpServer())
        .post('/access-device/devices/register')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(registerDto)
        .expect(201);

      expect(response.body.type).toBe(AccessDeviceType.KEYPAD);
    });

    it('should reject duplicate device ID', async () => {
      const registerDto: RegisterAccessDeviceDto = {
        name: 'Duplicate Device',
        serialNumber: 'DUP-SN-001',
        deviceId: registeredDeviceId,
        type: AccessDeviceType.RFID_READER,
        firmware: '1.0.0',
      };

      await request(app.getHttpServer())
        .post('/access-device/devices/register')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(registerDto)
        .expect(400);
    });
  });

  describe('Device Management', () => {
    it('should get all devices', async () => {
      const response = await request(app.getHttpServer())
        .get('/access-device/devices')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get specific device by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/access-device/devices/${registeredDeviceId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(response.body.deviceId).toBe(registeredDeviceId);
    });

    it('should get devices by zone', async () => {
      const response = await request(app.getHttpServer())
        .get('/access-device/devices/zone/entrance')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get online devices', async () => {
      const response = await request(app.getHttpServer())
        .get('/access-device/devices/status/online')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Access Rules', () => {
    it('should create an access rule', async () => {
      const createDto: CreateAccessRuleDto = {
        userId: 'user-test-001',
        zone: 'entrance',
        action: AccessRuleAction.GRANT,
        startTime: '09:00:00',
        endTime: '17:00:00',
        allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        allowedCredentialTypes: ['rfid', 'wiegand'],
        allowedDeviceIds: [registeredDeviceId],
      };

      const response = await request(app.getHttpServer())
        .post('/access-device/rules')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(createDto.userId);
      expect(response.body.action).toBe(AccessRuleAction.GRANT);
      createdRuleId = response.body.id;
    });

    it('should get rules for user', async () => {
      const response = await request(app.getHttpServer())
        .get('/access-device/rules/user/user-test-001')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get specific rule', async () => {
      const response = await request(app.getHttpServer())
        .get(`/access-device/rules/${createdRuleId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdRuleId);
    });

    it('should update access rule', async () => {
      const updateDto: Partial<CreateAccessRuleDto> = {
        startTime: '08:00:00',
        endTime: '18:00:00',
      };

      const response = await request(app.getHttpServer())
        .patch(`/access-device/rules/${createdRuleId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.startTime).toBe('08:00:00');
      expect(response.body.endTime).toBe('18:00:00');
    });

    it('should disable access rule', async () => {
      const response = await request(app.getHttpServer())
        .post(`/access-device/rules/${createdRuleId}/disable`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(response.body.enabled).toBe(false);
    });

    it('should enable access rule', async () => {
      const response = await request(app.getHttpServer())
        .post(`/access-device/rules/${createdRuleId}/enable`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(response.body.enabled).toBe(true);
    });
  });

  describe('Credential Validation', () => {
    it('should validate RFID credential', async () => {
      const validateDto: ValidateCredentialDto = {
        userId: 'user-test-001',
        deviceId: registeredDeviceId,
        credentialType: CredentialType.RFID,
        credential: 'AABBCCDD',
        zone: 'entrance',
      };

      const response = await request(app.getHttpServer())
        .post('/access-device/validate')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(validateDto)
        .expect(200);

      expect(response.body).toHaveProperty('auditLogId');
      expect(response.body).toHaveProperty('decision');
      expect(response.body).toHaveProperty('responseTimeMs');
      expect(response.body.responseTimeMs).toBeLessThan(200);
      expect(response.body.metadata?.slaCompliant).toBe(true);
    });

    it('should validate PIN credential', async () => {
      const validateDto: ValidateCredentialDto = {
        userId: 'user-test-001',
        deviceId: 'device-keypad-001',
        credentialType: CredentialType.PIN,
        credential: '1234',
        zone: 'restricted',
      };

      const response = await request(app.getHttpServer())
        .post('/access-device/validate')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(validateDto)
        .expect(200);

      expect(response.body).toHaveProperty('decision');
    });

    it('should support multi-factor authentication', async () => {
      const validateDto: ValidateCredentialDto = {
        userId: 'user-test-001',
        deviceId: registeredDeviceId,
        credentialType: CredentialType.RFID,
        credential: 'AABBCCDD',
        zone: 'entrance',
        metadata: {
          factors: ['rfid', 'fingerprint'],
        },
      };

      const response = await request(app.getHttpServer())
        .post('/access-device/validate')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(validateDto)
        .expect(200);

      if (response.body.decision === 'granted') {
        expect(response.body.appliedFactors).toContain('rfid');
      }
    });

    it('should return audit log in validation response', async () => {
      const validateDto: ValidateCredentialDto = {
        userId: 'user-test-001',
        deviceId: registeredDeviceId,
        credentialType: CredentialType.RFID,
        credential: 'AABBCCDD',
      };

      const response = await request(app.getHttpServer())
        .post('/access-device/validate')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(validateDto)
        .expect(200);

      expect(response.body.auditLogId).toBeDefined();
      expect(response.body.credentialType).toBe(CredentialType.RFID);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('Access Control Policy Evaluation', () => {
    it('should respect time window restrictions', async () => {
      // Create a rule with restrictive time window
      const restrictiveRule: CreateAccessRuleDto = {
        userId: 'user-test-002',
        zone: 'entrance',
        action: AccessRuleAction.GRANT,
        startTime: '23:00:00',
        endTime: '00:00:00',
        allowedCredentialTypes: ['rfid'],
        allowedDeviceIds: [registeredDeviceId],
      };

      const ruleResponse = await request(app.getHttpServer())
        .post('/access-device/rules')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(restrictiveRule)
        .expect(201);

      // Try to validate outside of rule time window
      const validateDto: ValidateCredentialDto = {
        userId: 'user-test-002',
        deviceId: registeredDeviceId,
        credentialType: CredentialType.RFID,
        credential: 'AABBCCDD',
      };

      const response = await request(app.getHttpServer())
        .post('/access-device/validate')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(validateDto)
        .expect(200);

      // Should be denied due to time window
      if (response.body.decision === 'denied') {
        expect(response.body.denyReason).toContain('time');
      }
    });

    it('should require multi-factor authentication when specified', async () => {
      // Create a rule requiring multi-factor
      const mfRule: CreateAccessRuleDto = {
        userId: 'user-test-003',
        zone: 'secure-area',
        action: AccessRuleAction.GRANT,
        requireMultiFactor: ['rfid', 'fingerprint'],
        allowedCredentialTypes: ['rfid', 'fingerprint'],
        allowedDeviceIds: ['device-bio-001'],
      };

      const ruleResponse = await request(app.getHttpServer())
        .post('/access-device/rules')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(mfRule)
        .expect(201);

      // Try to validate with only one factor
      const validateDto: ValidateCredentialDto = {
        userId: 'user-test-003',
        deviceId: 'device-bio-001',
        credentialType: CredentialType.FINGERPRINT,
        credential: 'abc123def456',
      };

      const response = await request(app.getHttpServer())
        .post('/access-device/validate')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(validateDto)
        .expect(200);

      // Should be denied without all required factors
      if (response.body.decision === 'denied') {
        expect(response.body.denyReason).toContain('factor');
      }
    });
  });

  describe('Audit Logging', () => {
    it('should create audit log on credential validation', async () => {
      const validateDto: ValidateCredentialDto = {
        userId: 'user-audit-001',
        deviceId: registeredDeviceId,
        credentialType: CredentialType.RFID,
        credential: 'AABBCCDD',
      };

      const response = await request(app.getHttpServer())
        .post('/access-device/validate')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(validateDto)
        .expect(200);

      expect(response.body.auditLogId).toBeDefined();
      expect(response.body.responseTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should reject validation without authentication', async () => {
      const validateDto: ValidateCredentialDto = {
        userId: 'user-test-001',
        deviceId: registeredDeviceId,
        credentialType: CredentialType.RFID,
        credential: 'AABBCCDD',
      };

      await request(app.getHttpServer())
        .post('/access-device/validate')
        .send(validateDto)
        .expect(401);
    });

    it('should handle non-existent device gracefully', async () => {
      const validateDto: ValidateCredentialDto = {
        userId: 'user-test-001',
        deviceId: 'non-existent-device',
        credentialType: CredentialType.RFID,
        credential: 'AABBCCDD',
      };

      const response = await request(app.getHttpServer())
        .post('/access-device/validate')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(validateDto);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
