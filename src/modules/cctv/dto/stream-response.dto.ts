import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StreamStatus, StreamProtocol, TranscodeFormat } from '../entities/camera-stream.entity';

export class StreamResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  deviceId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: StreamProtocol })
  protocol: StreamProtocol;

  @ApiProperty()
  sourceUrl: string;

  @ApiProperty({ enum: TranscodeFormat })
  transcodeFormat: TranscodeFormat;

  @ApiProperty({ enum: StreamStatus })
  status: StreamStatus;

  @ApiPropertyOptional()
  webrtcUrl?: string;

  @ApiPropertyOptional()
  hlsUrl?: string;

  @ApiProperty()
  isRecording: boolean;

  @ApiProperty()
  reconnectAttempts: number;

  @ApiPropertyOptional()
  lastHealthCheck?: Date;

  @ApiPropertyOptional()
  errorMessage?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
