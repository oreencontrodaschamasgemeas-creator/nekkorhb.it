import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray, IsObject } from 'class-validator';
import { AccessDeviceType } from '../entities/access-device.entity';

export class RegisterAccessDeviceDto {
  @ApiProperty({ example: 'Main Entrance RFID Reader' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'RFID-SN-001' })
  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @ApiProperty({ example: 'device-001' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({ enum: AccessDeviceType })
  @IsEnum(AccessDeviceType)
  @IsNotEmpty()
  type: AccessDeviceType;

  @ApiProperty({ example: '1.2.3' })
  @IsString()
  @IsNotEmpty()
  firmware: string;

  @ApiProperty({ example: 'HID Prox Reader 5355', required: false })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ example: 'Building A, Floor 2', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: 'zone-1', required: false })
  @IsString()
  @IsOptional()
  zone?: string;

  @ApiProperty({ example: ['192.168.1.100'], required: false })
  @IsArray()
  @IsOptional()
  ipAddresses?: string[];

  @ApiProperty({ example: { macAddress: '00:11:22:33:44:55' }, required: false })
  @IsObject()
  @IsOptional()
  networkInfo?: Record<string, any>;

  @ApiProperty({ example: ['rfid', 'wiegand'], required: false })
  @IsArray()
  @IsOptional()
  supportedCredentialTypes?: string[];

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
