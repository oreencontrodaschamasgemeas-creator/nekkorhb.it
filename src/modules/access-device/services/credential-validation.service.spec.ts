import { Test, TestingModule } from '@nestjs/testing';
import { CredentialValidationService } from './credential-validation.service';
import { AccessAuditService } from './access-audit.service';
import { AccessRuleService } from './access-rule.service';
import { DeviceRegistryService } from './device-registry.service';
import { HardwareAdapterFactory } from '../adapters/hardware-adapter.factory';
import { ValidateCredentialDto, CredentialType } from '../dto/validate-credential.dto';
import { AccessDevice, AccessDeviceStatus } from '../entities/access-device.entity';
import { AccessRule, AccessRuleAction } from '../entities/access-rule.entity';
import { AccessDecision, AccessDenyReason } from '../entities/access-audit-log.entity';

describe('CredentialValidationService', () => {
  let service: CredentialValidationService;
  let mockAuditService: any;
  let mockRuleService: any;
  let mockDeviceRegistry: any;
  let mockAdapterFactory: any;

  beforeEach(async () => {
    mockAuditService = {
      createAuditLog: jest.fn(),
    };

    mockRuleService = {
      findRulesForUserAndZone: jest.fn(),
      evaluateTimeWindow: jest.fn().mockResolvedValue(true),
      checkCredentialTypeAllowed: jest.fn().mockResolvedValue(true),
      checkDeviceAllowed: jest.fn().mockResolvedValue(true),
    };

    mockDeviceRegistry = {
      findDeviceById: jest.fn(),
      recordSuccessfulAttempt: jest.fn(),
      recordFailedAttempt: jest.fn(),
    };

    mockAdapterFactory = {
      getAdapterByCredentialType: jest.fn().mockReturnValue({
        parseCredential: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CredentialValidationService,
        {
          provide: AccessAuditService,
          useValue: mockAuditService,
        },
        {
          provide: AccessRuleService,
          useValue: mockRuleService,
        },
        {
          provide: DeviceRegistryService,
          useValue: mockDeviceRegistry,
        },
        {
          provide: HardwareAdapterFactory,
          useValue: mockAdapterFactory,
        },
      ],
    }).compile();

    service = module.get<CredentialValidationService>(CredentialValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCredential', () => {
    const validateDto: ValidateCredentialDto = {
      userId: 'user-123',
      deviceId: 'device-123',
      credentialType: CredentialType.RFID,
      credential: 'AABBCCDD',
    };

    const mockDevice: Partial<AccessDevice> = {
      id: 'device-internal-id',
      deviceId: 'device-123',
      status: AccessDeviceStatus.ONLINE,
      zone: 'zone-1',
    };

    const mockRule: Partial<AccessRule> = {
      id: 'rule-123',
      userId: 'user-123',
      action: AccessRuleAction.GRANT,
    };

    it('should grant access when rule matches', async () => {
      mockDeviceRegistry.findDeviceById.mockResolvedValue(mockDevice);
      mockRuleService.findRulesForUserAndZone.mockResolvedValue([mockRule]);
      mockAuditService.createAuditLog.mockResolvedValue({ id: 'audit-log-id' });

      const result = await service.validateCredential(validateDto);

      expect(result.decision).toBe(AccessDecision.GRANTED);
      expect(result.message).toContain('Access granted');
    });

    it('should deny access when no rules found', async () => {
      mockDeviceRegistry.findDeviceById.mockResolvedValue(mockDevice);
      mockRuleService.findRulesForUserAndZone.mockResolvedValue([]);
      mockAuditService.createAuditLog.mockResolvedValue({ id: 'audit-log-id' });

      const result = await service.validateCredential(validateDto);

      expect(result.decision).toBe(AccessDecision.DENIED);
      expect(result.denyReason).toBe(AccessDenyReason.NO_RULE);
    });

    it('should deny access when device is offline', async () => {
      const offlineDevice = { ...mockDevice, status: AccessDeviceStatus.OFFLINE };
      mockDeviceRegistry.findDeviceById.mockResolvedValue(offlineDevice);
      mockAuditService.createAuditLog.mockResolvedValue({ id: 'audit-log-id' });

      const result = await service.validateCredential(validateDto);

      expect(result.decision).toBe(AccessDecision.ERROR);
      expect(result.message).toContain('not online');
    });

    it('should deny access when outside time window', async () => {
      mockDeviceRegistry.findDeviceById.mockResolvedValue(mockDevice);
      mockRuleService.findRulesForUserAndZone.mockResolvedValue([mockRule]);
      mockRuleService.evaluateTimeWindow.mockResolvedValue(false);
      mockAuditService.createAuditLog.mockResolvedValue({ id: 'audit-log-id' });

      const result = await service.validateCredential(validateDto);

      expect(result.decision).toBe(AccessDecision.DENIED);
      expect(result.denyReason).toBe(AccessDenyReason.OUTSIDE_TIME_WINDOW);
    });

    it('should require multi-factor when specified in rule', async () => {
      const mfRule = {
        ...mockRule,
        requireMultiFactor: ['fingerprint'],
      };

      mockDeviceRegistry.findDeviceById.mockResolvedValue(mockDevice);
      mockRuleService.findRulesForUserAndZone.mockResolvedValue([mfRule]);
      mockAuditService.createAuditLog.mockResolvedValue({ id: 'audit-log-id' });

      const result = await service.validateCredential(validateDto);

      expect(result.decision).toBe(AccessDecision.DENIED);
      expect(result.denyReason).toBe(AccessDenyReason.MULTI_FACTOR_REQUIRED);
    });

    it('should grant access with multi-factor when all factors provided', async () => {
      const mfRule = {
        ...mockRule,
        requireMultiFactor: ['fingerprint'],
      };

      const dtoWithFactors = {
        ...validateDto,
        metadata: { factors: ['fingerprint'] },
      };

      mockDeviceRegistry.findDeviceById.mockResolvedValue(mockDevice);
      mockRuleService.findRulesForUserAndZone.mockResolvedValue([mfRule]);
      mockAuditService.createAuditLog.mockResolvedValue({
        id: 'audit-log-id',
      });

      const result = await service.validateCredential(dtoWithFactors);

      expect(result.decision).toBe(AccessDecision.GRANTED);
      expect(result.appliedFactors).toContain('fingerprint');
    });

    it('should respect SLA requirement', async () => {
      mockDeviceRegistry.findDeviceById.mockResolvedValue(mockDevice);
      mockRuleService.findRulesForUserAndZone.mockResolvedValue([mockRule]);
      mockAuditService.createAuditLog.mockResolvedValue({ id: 'audit-log-id' });

      const result = await service.validateCredential(validateDto);

      expect(result.responseTimeMs).toBeLessThan(200);
      expect(result.metadata?.slaCompliant).toBe(true);
    });
  });
});
