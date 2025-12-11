import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ example: 'dashboard-client' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ example: 'super-secret', description: 'Required for confidential clients' })
  @IsOptional()
  @IsString()
  clientSecret?: string;

  @ApiPropertyOptional({ example: 'devices:read incidents:read', description: 'Space delimited scopes override' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ example: 'fingerprint-hash' })
  @IsOptional()
  @IsString()
  fingerprint?: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5)' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ example: '10.1.0.24' })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}
