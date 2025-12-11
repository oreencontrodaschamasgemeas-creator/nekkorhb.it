import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsObject, IsOptional } from 'class-validator';

export enum CredentialType {
  RFID = 'rfid',
  FINGERPRINT = 'fingerprint',
  FACE = 'face',
  PIN = 'pin',
  MULTI_MODAL = 'multi_modal',
}

export class ValidateCredentialDto {
  @ApiProperty({ example: 'user-123' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'device-001' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({ enum: CredentialType })
  @IsEnum(CredentialType)
  @IsNotEmpty()
  credentialType: CredentialType;

  @ApiProperty({ example: 'AABBCCDD' })
  @IsString()
  @IsNotEmpty()
  credential: string;

  @ApiProperty({ example: 'zone-1', required: false })
  @IsString()
  @IsOptional()
  zone?: string;

  @ApiProperty({ example: { confidence: 0.95 }, required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
