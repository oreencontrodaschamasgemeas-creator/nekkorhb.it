import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { FeedType, FeedSeverity } from '../entities/monitoring-feed.entity';

export class CreateMonitoringFeedDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({ enum: FeedType, example: FeedType.METRIC })
  @IsEnum(FeedType)
  @IsNotEmpty()
  type: FeedType;

  @ApiProperty({ enum: FeedSeverity, example: FeedSeverity.INFO })
  @IsEnum(FeedSeverity)
  @IsNotEmpty()
  severity: FeedSeverity;

  @ApiProperty({ example: 'Device temperature reading' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ example: { temperature: 25.5, unit: 'celsius' }, required: false })
  @IsOptional()
  data?: Record<string, any>;
}
