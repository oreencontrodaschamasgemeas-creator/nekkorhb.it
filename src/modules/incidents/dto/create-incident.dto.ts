import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { IncidentPriority } from '../entities/incident.entity';

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

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  @IsUUID()
  @IsOptional()
  deviceId?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', required: false })
  @IsUUID()
  @IsOptional()
  assignedTo?: string;
}
