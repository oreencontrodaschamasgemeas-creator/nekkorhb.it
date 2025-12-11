import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsObject, IsUUID, IsDateString } from 'class-validator';
import { SensorEventType } from '../entities/sensor-event.entity';

export class IngestEventDto {
  @ApiProperty({ description: 'Device ID' })
  @IsUUID()
  deviceId: string;

  @ApiProperty({ enum: SensorEventType, description: 'Event type' })
  @IsEnum(SensorEventType)
  type: SensorEventType;

  @ApiProperty({ description: 'Event value' })
  @IsString()
  value: string;

  @ApiProperty({ description: 'Event timestamp (ISO 8601)' })
  @IsDateString()
  timestamp: string;

  @ApiPropertyOptional({ description: 'Raw event data' })
  @IsOptional()
  @IsObject()
  rawData?: Record<string, any>;
}
