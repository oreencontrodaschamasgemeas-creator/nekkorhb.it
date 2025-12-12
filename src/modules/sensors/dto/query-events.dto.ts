import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SensorEventType, SensorEventStatus } from '../entities/sensor-event.entity';

export class QueryEventsDto {
  @ApiPropertyOptional({ description: 'Device ID filter' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ enum: SensorEventType, description: 'Event type filter' })
  @IsOptional()
  @IsEnum(SensorEventType)
  type?: SensorEventType;

  @ApiPropertyOptional({ enum: SensorEventStatus, description: 'Event status filter' })
  @IsOptional()
  @IsEnum(SensorEventStatus)
  status?: SensorEventStatus;

  @ApiPropertyOptional({ description: 'Start time filter (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time filter (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;
}
