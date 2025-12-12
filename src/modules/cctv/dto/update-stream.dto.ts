import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { StreamStatus, TranscodeFormat } from '../entities/camera-stream.entity';

export class UpdateStreamDto {
  @ApiPropertyOptional({ description: 'Stream name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: TranscodeFormat, description: 'Transcode format' })
  @IsOptional()
  @IsEnum(TranscodeFormat)
  transcodeFormat?: TranscodeFormat;

  @ApiPropertyOptional({ description: 'Enable recording' })
  @IsOptional()
  @IsBoolean()
  isRecording?: boolean;

  @ApiPropertyOptional({ enum: StreamStatus, description: 'Stream status' })
  @IsOptional()
  @IsEnum(StreamStatus)
  status?: StreamStatus;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
