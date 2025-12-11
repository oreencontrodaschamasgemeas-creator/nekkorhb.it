import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessRule, AccessRuleAction } from '../entities/access-rule.entity';
import { CreateAccessRuleDto } from '../dto/create-access-rule.dto';

@Injectable()
export class AccessRuleService {
  private readonly logger = new Logger(AccessRuleService.name);

  constructor(
    @InjectRepository(AccessRule)
    private rulesRepository: Repository<AccessRule>,
  ) {}

  async createRule(createDto: CreateAccessRuleDto): Promise<AccessRule> {
    const rule = this.rulesRepository.create({
      ...createDto,
      action: createDto.action || AccessRuleAction.GRANT,
      effectiveFrom: createDto.effectiveFrom ? new Date(createDto.effectiveFrom) : null,
      effectiveUntil: createDto.effectiveUntil ? new Date(createDto.effectiveUntil) : null,
    });

    return this.rulesRepository.save(rule);
  }

  async findRulesForUser(userId: string): Promise<AccessRule[]> {
    return this.rulesRepository.find({
      where: { userId, enabled: true },
    });
  }

  async findRulesForUserAndZone(userId: string, zone?: string): Promise<AccessRule[]> {
    const query = this.rulesRepository.createQueryBuilder('rule');
    query.where('rule.userId = :userId', { userId });
    query.andWhere('rule.enabled = true');

    if (zone) {
      query.andWhere('(rule.zone = :zone OR rule.zone IS NULL)', { zone });
    }

    return query.getMany();
  }

  async findRuleById(ruleId: string): Promise<AccessRule> {
    const rule = await this.rulesRepository.findOne({
      where: { id: ruleId },
    });

    if (!rule) {
      throw new NotFoundException(`Rule not found: ${ruleId}`);
    }

    return rule;
  }

  async updateRule(ruleId: string, updateDto: Partial<CreateAccessRuleDto>): Promise<AccessRule> {
    const rule = await this.findRuleById(ruleId);

    const updatedData = {
      ...updateDto,
      effectiveFrom: updateDto.effectiveFrom
        ? new Date(updateDto.effectiveFrom)
        : rule.effectiveFrom,
      effectiveUntil: updateDto.effectiveUntil
        ? new Date(updateDto.effectiveUntil)
        : rule.effectiveUntil,
    };

    Object.assign(rule, updatedData);
    return this.rulesRepository.save(rule);
  }

  async deleteRule(ruleId: string): Promise<void> {
    const rule = await this.findRuleById(ruleId);
    await this.rulesRepository.remove(rule);
  }

  async disableRule(ruleId: string): Promise<AccessRule> {
    const rule = await this.findRuleById(ruleId);
    rule.enabled = false;
    return this.rulesRepository.save(rule);
  }

  async enableRule(ruleId: string): Promise<AccessRule> {
    const rule = await this.findRuleById(ruleId);
    rule.enabled = true;
    return this.rulesRepository.save(rule);
  }

  async getAllRules(): Promise<AccessRule[]> {
    return this.rulesRepository.find();
  }

  async evaluateTimeWindow(rule: AccessRule): Promise<boolean> {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 8);
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' as const }).toLowerCase();

    // Check effective date range
    if (rule.effectiveFrom && now < rule.effectiveFrom) {
      return false;
    }
    if (rule.effectiveUntil && now > rule.effectiveUntil) {
      return false;
    }

    // Check time window
    if (rule.startTime && currentTime < rule.startTime) {
      return false;
    }
    if (rule.endTime && currentTime > rule.endTime) {
      return false;
    }

    // Check allowed days
    if (rule.allowedDays && rule.allowedDays.length > 0) {
      if (!rule.allowedDays.includes(currentDay)) {
        return false;
      }
    }

    return true;
  }

  async checkCredentialTypeAllowed(rule: AccessRule, credentialType: string): Promise<boolean> {
    if (!rule.allowedCredentialTypes || rule.allowedCredentialTypes.length === 0) {
      return true;
    }

    return rule.allowedCredentialTypes.includes(credentialType);
  }

  async checkDeviceAllowed(rule: AccessRule, deviceId: string): Promise<boolean> {
    if (!rule.allowedDeviceIds || rule.allowedDeviceIds.length === 0) {
      return true;
    }

    return rule.allowedDeviceIds.includes(deviceId);
  }

  async checkDailyAttemptLimit(
    userId: string,
    ruleId: string,
    currentAttempts: number,
  ): Promise<boolean> {
    const rule = await this.findRuleById(ruleId);

    if (!rule.maxDailyAttempts) {
      return true;
    }

    return currentAttempts < rule.maxDailyAttempts;
  }
}
