import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  IsObject,
  IsDateString,
} from 'class-validator';
import { IncidentPriority, IncidentCategory, IncidentSource } from '../entities/incident.entity';

export class CreateIncidentDto {
  @ApiProperty({ example: 'Device malfunction detected' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Device stopped responding to health checks' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: IncidentPriority, example: IncidentPriority.HIGH })
  @IsEnum(IncidentPriority)
  @IsNotEmpty()
  priority: IncidentPriority;

  @ApiProperty({
    enum: IncidentCategory,
    example: IncidentCategory.DEVICE_MALFUNCTION,
    required: false,
  })
  @IsEnum(IncidentCategory)
  @IsOptional()
  category?: IncidentCategory;

  @ApiProperty({
    enum: IncidentSource,
    example: IncidentSource.SENSOR,
    required: false,
  })
  @IsEnum(IncidentSource)
  @IsOptional()
  source?: IncidentSource;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  @IsUUID()
  @IsOptional()
  deviceId?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', required: false })
  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @ApiProperty({
    example: ['user1-id', 'user2-id'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsOptional()
  assignees?: string[];

  @ApiProperty({
    example: '2024-12-20T12:00:00Z',
    required: false,
    type: String,
  })
  @IsDateString()
  @IsOptional()
  slaDeadline?: string;

  @ApiProperty({
    example: [{ item: 'Verify device functionality', completed: false }],
    required: false,
  })
  @IsArray()
  @IsOptional()
  resolutionChecklist?: { item: string; completed: boolean }[];

  @ApiProperty({ example: { source: 'monitoring_system' }, required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
