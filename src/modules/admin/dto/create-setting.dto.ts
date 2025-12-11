import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SettingType } from '../entities/setting.entity';

export class CreateSettingDto {
  @ApiProperty({ example: 'max_devices' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: '100' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ enum: SettingType, example: SettingType.NUMBER })
  @IsEnum(SettingType)
  @IsNotEmpty()
  type: SettingType;

  @ApiProperty({ example: 'Maximum number of devices allowed', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
