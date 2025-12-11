import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AccessDecision, AccessDenyReason } from '../entities/access-audit-log.entity';
import { AccessAuditService } from './access-audit.service';
import { AccessRuleService } from './access-rule.service';
import { DeviceRegistryService } from './device-registry.service';
import { HardwareAdapterFactory } from '../adapters/hardware-adapter.factory';
import { AccessDeviceStatus } from '../entities/access-device.entity';
import { ValidationResponseDto } from '../dto/validation-response.dto';
import { ValidateCredentialDto } from '../dto/validate-credential.dto';

@Injectable()
export class CredentialValidationService {
  private readonly logger = new Logger(CredentialValidationService.name);
  private readonly MAX_RESPONSE_TIME_MS = 200;

  constructor(
    private auditService: AccessAuditService,
    private ruleService: AccessRuleService,
    private deviceRegistry: DeviceRegistryService,
    private adapterFactory: HardwareAdapterFactory,
  ) {}

  async validateCredential(validateDto: ValidateCredentialDto): Promise<ValidationResponseDto> {
    const startTime = Date.now();

    try {
      // Validate device exists and is online
      let device;
      try {
        device = await this.deviceRegistry.findDeviceById(validateDto.deviceId);
      } catch {
        throw new BadRequestException(`Device not found: ${validateDto.deviceId}`);
      }

      if (device.status !== AccessDeviceStatus.ONLINE) {
        await this.handleDeviceOffline(validateDto, startTime);
        throw new ServiceUnavailableException(`Device is not online: ${device.status}`);
      }

      // Parse credential using appropriate adapter
      let credentialId = validateDto.credential;
      let appliedFactors: string[] = [];

      try {
        this.adapterFactory.getAdapterByCredentialType(validateDto.credentialType);
        // In a real implementation, we would parse the raw credential
        // For now, use the credential as-is
        credentialId = validateDto.credential;
      } catch (error) {
        this.logger.error(`Failed to parse credential: ${error.message}`);
        return this.createDeniedResponse(
          validateDto,
          AccessDenyReason.INVALID_CREDENTIAL,
          startTime,
        );
      }

      // Find applicable rules for user
      const rules = await this.ruleService.findRulesForUserAndZone(
        validateDto.userId,
        validateDto.zone || device.zone,
      );

      if (rules.length === 0) {
        return this.createDeniedResponse(validateDto, AccessDenyReason.NO_RULE, startTime);
      }

      // Evaluate rules
      let decision = AccessDecision.DENIED;
      let applicableRule = null;
      let denyReason = AccessDenyReason.NO_RULE;

      for (const rule of rules) {
        // Check if rule action is GRANT
        if (rule.action !== 'grant') {
          continue;
        }

        // Check time window
        const timeWindowValid = await this.ruleService.evaluateTimeWindow(rule);
        if (!timeWindowValid) {
          denyReason = AccessDenyReason.OUTSIDE_TIME_WINDOW;
          continue;
        }

        // Check credential type allowed
        const credTypeAllowed = await this.ruleService.checkCredentialTypeAllowed(
          rule,
          validateDto.credentialType,
        );
        if (!credTypeAllowed) {
          continue;
        }

        // Check device allowed
        const deviceAllowed = await this.ruleService.checkDeviceAllowed(rule, validateDto.deviceId);
        if (!deviceAllowed) {
          continue;
        }

        // Check multi-factor requirements
        const mfRequired = rule.requireMultiFactor || [];
        if (mfRequired.length > 0) {
          if (!validateDto.metadata || !validateDto.metadata.factors) {
            denyReason = AccessDenyReason.MULTI_FACTOR_REQUIRED;
            continue;
          }

          const providedFactors = validateDto.metadata.factors as string[];
          const allFactorsProvided = mfRequired.every((f) => providedFactors.includes(f));

          if (!allFactorsProvided) {
            denyReason = AccessDenyReason.MULTI_FACTOR_FAILED;
            continue;
          }

          appliedFactors = providedFactors;
        }

        // Rule passed all checks
        decision = AccessDecision.GRANTED;
        applicableRule = rule;
        break;
      }

      const responseTimeMs = Date.now() - startTime;

      // Create audit log
      const auditLog = await this.auditService.createAuditLog({
        userId: validateDto.userId,
        deviceId: validateDto.deviceId,
        zone: validateDto.zone || device.zone,
        decision,
        denyReason: decision === AccessDecision.DENIED ? denyReason : undefined,
        credentialType: validateDto.credentialType,
        credentialId,
        responseTimeMs,
        ruleId: applicableRule?.id,
        appliedFactors,
        metadata: validateDto.metadata,
      });

      // Update device status
      if (responseTimeMs <= this.MAX_RESPONSE_TIME_MS) {
        await this.deviceRegistry.recordSuccessfulAttempt(validateDto.deviceId);
      }

      return {
        auditLogId: auditLog.id,
        userId: validateDto.userId,
        deviceId: validateDto.deviceId,
        decision,
        denyReason: decision === AccessDecision.DENIED ? denyReason : undefined,
        credentialType: validateDto.credentialType,
        responseTimeMs,
        ruleId: applicableRule?.id,
        appliedFactors,
        message:
          decision === AccessDecision.GRANTED ? 'Access granted' : `Access denied: ${denyReason}`,
        metadata: {
          slaCompliant: responseTimeMs <= this.MAX_RESPONSE_TIME_MS,
        },
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;

      this.logger.error(`Validation error for user ${validateDto.userId}: ${error.message}`);

      const auditLog = await this.auditService.createAuditLog({
        userId: validateDto.userId,
        deviceId: validateDto.deviceId,
        zone: validateDto.zone,
        decision: AccessDecision.ERROR,
        denyReason: AccessDenyReason.SYSTEM_ERROR,
        credentialType: validateDto.credentialType,
        responseTimeMs,
        metadata: { error: error.message },
      });

      return {
        auditLogId: auditLog.id,
        userId: validateDto.userId,
        deviceId: validateDto.deviceId,
        decision: AccessDecision.ERROR,
        denyReason: AccessDenyReason.SYSTEM_ERROR,
        credentialType: validateDto.credentialType,
        responseTimeMs,
        appliedFactors: [],
        message: `Validation error: ${error.message}`,
      };
    }
  }

  private async handleDeviceOffline(
    validateDto: ValidateCredentialDto,
    startTime: number,
  ): Promise<void> {
    const responseTimeMs = Date.now() - startTime;

    await this.auditService.createAuditLog({
      userId: validateDto.userId,
      deviceId: validateDto.deviceId,
      zone: validateDto.zone,
      decision: AccessDecision.DENIED,
      denyReason: AccessDenyReason.DEVICE_OFFLINE,
      credentialType: validateDto.credentialType,
      responseTimeMs,
    });

    await this.deviceRegistry.recordFailedAttempt(validateDto.deviceId);
  }

  private createDeniedResponse(
    validateDto: ValidateCredentialDto,
    denyReason: AccessDenyReason,
    startTime: number,
  ): ValidationResponseDto {
    const responseTimeMs = Date.now() - startTime;

    return {
      auditLogId: '',
      userId: validateDto.userId,
      deviceId: validateDto.deviceId,
      decision: AccessDecision.DENIED,
      denyReason,
      credentialType: validateDto.credentialType,
      responseTimeMs,
      appliedFactors: [],
      message: `Access denied: ${denyReason}`,
    };
  }
}
