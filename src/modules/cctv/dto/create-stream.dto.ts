import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
  IsUUID,
  IsUrl,
} from 'class-validator';
import { StreamProtocol, TranscodeFormat } from '../entities/camera-stream.entity';

export class CreateStreamDto {
  @ApiProperty({ description: 'Device ID' })
  @IsUUID()
  deviceId: string;

  @ApiProperty({ description: 'Stream name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: StreamProtocol, description: 'Stream protocol' })
  @IsEnum(StreamProtocol)
  protocol: StreamProtocol;

  @ApiProperty({ description: 'Source stream URL' })
  @IsUrl()
  sourceUrl: string;

  @ApiPropertyOptional({ description: 'Stream username' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'Stream password' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({
    enum: TranscodeFormat,
    description: 'Transcode format',
    default: TranscodeFormat.BOTH,
  })
  @IsEnum(TranscodeFormat)
  @IsOptional()
  transcodeFormat?: TranscodeFormat;

  @ApiPropertyOptional({ description: 'Enable recording', default: false })
  @IsOptional()
  @IsBoolean()
  isRecording?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
