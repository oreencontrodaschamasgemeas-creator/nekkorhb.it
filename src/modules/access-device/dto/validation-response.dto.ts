import { ApiProperty } from '@nestjs/swagger';
import { AccessDecision, AccessDenyReason } from '../entities/access-audit-log.entity';

export class ValidationResponseDto {
  @ApiProperty()
  auditLogId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  deviceId: string;

  @ApiProperty({ enum: AccessDecision })
  decision: AccessDecision;

  @ApiProperty({ enum: AccessDenyReason, required: false })
  denyReason?: AccessDenyReason;

  @ApiProperty()
  credentialType: string;

  @ApiProperty()
  responseTimeMs: number;

  @ApiProperty({ required: false })
  ruleId?: string;

  @ApiProperty({ example: ['factor1', 'factor2'] })
  appliedFactors: string[];

  @ApiProperty({ required: false })
  message: string;

  @ApiProperty({ required: false })
  metadata?: Record<string, any>;
}
