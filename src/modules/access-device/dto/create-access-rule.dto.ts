import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsObject,
  IsNumber,
} from 'class-validator';
import { AccessRuleAction, DayOfWeek } from '../entities/access-rule.entity';

export class CreateAccessRuleDto {
  @ApiProperty({ example: 'user-123' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'zone-1', required: false })
  @IsString()
  @IsOptional()
  zone?: string;

  @ApiProperty({ enum: AccessRuleAction, default: AccessRuleAction.GRANT })
  @IsEnum(AccessRuleAction)
  @IsOptional()
  action?: AccessRuleAction;

  @ApiProperty({ example: '09:00:00', required: false })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({ example: '17:00:00', required: false })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({
    example: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY],
    required: false,
  })
  @IsArray()
  @IsOptional()
  allowedDays?: string[];

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiProperty({ example: '2024-12-31', required: false })
  @IsString()
  @IsOptional()
  effectiveUntil?: string;

  @ApiProperty({ example: ['fingerprint', 'pin'], required: false })
  @IsArray()
  @IsOptional()
  requireMultiFactor?: string[];

  @ApiProperty({ example: ['rfid', 'pin'], required: false })
  @IsArray()
  @IsOptional()
  allowedCredentialTypes?: string[];

  @ApiProperty({ example: ['device-001', 'device-002'], required: false })
  @IsArray()
  @IsOptional()
  allowedDeviceIds?: string[];

  @ApiProperty({ example: 10, required: false })
  @IsNumber()
  @IsOptional()
  maxDailyAttempts?: number;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
