import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DeviceType, DeviceStatus } from '../entities/device.entity';

export class CreateDeviceDto {
  @ApiProperty({ example: 'Camera 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'SN-123456789' })
  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @ApiProperty({ enum: DeviceType, example: DeviceType.CAMERA })
  @IsEnum(DeviceType)
  @IsNotEmpty()
  type: DeviceType;

  @ApiProperty({ enum: DeviceStatus, example: DeviceStatus.OFFLINE, required: false })
  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;

  @ApiProperty({ example: 'Building A, Floor 2', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: { firmware: '1.0.0', model: 'X1000' }, required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}
