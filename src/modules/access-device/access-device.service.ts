import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { RegisterAccessDeviceDto } from './dto/register-access-device.dto';
import { ValidateCredentialDto } from './dto/validate-credential.dto';
import { CreateAccessRuleDto } from './dto/create-access-rule.dto';
import { ValidationResponseDto } from './dto/validation-response.dto';
import { DeviceRegistryService } from './services/device-registry.service';
import { CredentialValidationService } from './services/credential-validation.service';
import { AccessRuleService } from './services/access-rule.service';
import { AccessAuditService } from './services/access-audit.service';
import { AccessDevice } from './entities/access-device.entity';
import { AccessRule } from './entities/access-rule.entity';

@Injectable()
export class AccessDeviceService {
  private readonly logger = new Logger(AccessDeviceService.name);

  constructor(
    @InjectQueue('access-validation')
    private validationQueue: Queue,
    private deviceRegistry: DeviceRegistryService,
    private credentialValidation: CredentialValidationService,
    private ruleService: AccessRuleService,
    private auditService: AccessAuditService,
  ) {}

  async registerDevice(registerDto: RegisterAccessDeviceDto): Promise<AccessDevice> {
    return this.deviceRegistry.registerDevice(registerDto);
  }

  async validateCredential(validateDto: ValidateCredentialDto): Promise<ValidationResponseDto> {
    return this.credentialValidation.validateCredential(validateDto);
  }

  async validateCredentialAsync(validateDto: ValidateCredentialDto): Promise<{ jobId: string }> {
    const job = await this.validationQueue.add(validateDto, {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 100,
      },
    });

    return { jobId: job.id.toString() };
  }

  async createAccessRule(createDto: CreateAccessRuleDto): Promise<AccessRule> {
    return this.ruleService.createRule(createDto);
  }

  async getAccessRulesForUser(userId: string): Promise<AccessRule[]> {
    return this.ruleService.findRulesForUser(userId);
  }

  async getAccessRule(ruleId: string): Promise<AccessRule> {
    return this.ruleService.findRuleById(ruleId);
  }

  async updateAccessRule(
    ruleId: string,
    updateDto: Partial<CreateAccessRuleDto>,
  ): Promise<AccessRule> {
    return this.ruleService.updateRule(ruleId, updateDto);
  }

  async deleteAccessRule(ruleId: string): Promise<void> {
    return this.ruleService.deleteRule(ruleId);
  }

  async disableAccessRule(ruleId: string): Promise<AccessRule> {
    return this.ruleService.disableRule(ruleId);
  }

  async enableAccessRule(ruleId: string): Promise<AccessRule> {
    return this.ruleService.enableRule(ruleId);
  }

  async getDevice(deviceId: string): Promise<AccessDevice> {
    return this.deviceRegistry.findDeviceById(deviceId);
  }

  async getAllDevices(): Promise<AccessDevice[]> {
    return this.deviceRegistry.getAllDevices();
  }

  async getDevicesByZone(zone: string): Promise<AccessDevice[]> {
    return this.deviceRegistry.getDevicesByZone(zone);
  }

  async getOnlineDevices(): Promise<AccessDevice[]> {
    return this.deviceRegistry.getOnlineDevices();
  }
}
