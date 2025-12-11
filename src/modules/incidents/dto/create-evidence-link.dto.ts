import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsEnum,
  IsDateString,
  IsObject,
} from 'class-validator';
import { EvidenceType } from '../entities/incident-evidence-link.entity';

export class CreateEvidenceLinkDto {
  @ApiProperty({ enum: EvidenceType, example: EvidenceType.CCTV_CLIP })
  @IsEnum(EvidenceType)
  @IsNotEmpty()
  type: EvidenceType;

  @ApiProperty({ example: 'Main entrance CCTV clip' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Video recording showing the incident',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'https://media.example.com/clip-12345.mp4' })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    example: 'media-uuid-12345',
    required: false,
  })
  @IsString()
  @IsOptional()
  mediaId?: string;

  @ApiProperty({
    example: '2024-12-20T10:30:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  timestamp?: string;

  @ApiProperty({ example: { duration: 120, resolution: '1080p' }, required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class EvidenceLinkResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  incidentId: string;

  @ApiProperty()
  type: EvidenceType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  mediaId?: string;

  @ApiProperty()
  timestamp?: Date;

  @ApiProperty()
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;
}
