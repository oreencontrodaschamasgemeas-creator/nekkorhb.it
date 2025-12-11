import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RecordingStatus } from '../entities/recording.entity';

export class QueryRecordingsDto {
  @ApiPropertyOptional({ description: 'Camera stream ID filter' })
  @IsOptional()
  @IsString()
  cameraStreamId?: string;

  @ApiPropertyOptional({ description: 'Incident ID filter' })
  @IsOptional()
  @IsString()
  incidentId?: string;

  @ApiPropertyOptional({ enum: RecordingStatus, description: 'Recording status filter' })
  @IsOptional()
  @IsEnum(RecordingStatus)
  status?: RecordingStatus;

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
