import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum TokenGrantType {
  PASSWORD = 'password',
  CLIENT_CREDENTIALS = 'client_credentials',
  AUTHORIZATION_CODE = 'authorization_code',
  REFRESH_TOKEN = 'refresh_token',
}

const extract = (key: string) => ({ value, obj }: { value: any; obj: Record<string, any> }) => {
  if (value !== undefined && value !== null) {
    return value;
  }

  if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
    return obj[key];
  }

  return undefined;
};

export class TokenRequestDto {
  @ApiProperty({ name: 'grant_type', enum: TokenGrantType })
  @IsNotEmpty()
  @IsEnum(TokenGrantType)
  @Transform(({ value, obj }) => value ?? obj?.grant_type ?? obj?.grantType)
  grantType: TokenGrantType;

  @ApiPropertyOptional({ name: 'client_id' })
  @IsOptional()
  @IsString()
  @Transform(({ value, obj }) => value ?? obj?.client_id ?? obj?.clientId)
  clientId?: string;

  @ApiPropertyOptional({ name: 'client_secret' })
  @IsOptional()
  @IsString()
  @Transform(({ value, obj }) => value ?? obj?.client_secret ?? obj?.clientSecret)
  clientSecret?: string;

  @ApiPropertyOptional({ description: 'Resource owner username (password grant)' })
  @IsOptional()
  @IsString()
  @Transform(extract('username'))
  username?: string;

  @ApiPropertyOptional({ description: 'Resource owner password (password grant)' })
  @IsOptional()
  @IsString()
  @Transform(extract('password'))
  password?: string;

  @ApiPropertyOptional({ description: 'Authorization code (authorization_code grant)' })
  @IsOptional()
  @IsString()
  @Transform(extract('code'))
  code?: string;

  @ApiPropertyOptional({ name: 'redirect_uri' })
  @IsOptional()
  @IsString()
  @Transform(({ value, obj }) => value ?? obj?.redirect_uri ?? obj?.redirectUri)
  redirectUri?: string;

  @ApiPropertyOptional({ name: 'code_verifier' })
  @IsOptional()
  @IsString()
  @Transform(({ value, obj }) => value ?? obj?.code_verifier ?? obj?.codeVerifier)
  codeVerifier?: string;

  @ApiPropertyOptional({ name: 'refresh_token' })
  @IsOptional()
  @IsString()
  @Transform(({ value, obj }) => value ?? obj?.refresh_token ?? obj?.refreshToken)
  refreshToken?: string;

  @ApiPropertyOptional({ description: 'Space delimited scopes' })
  @IsOptional()
  @IsString()
  @Transform(extract('scope'))
  scope?: string;

  @ApiPropertyOptional({ description: 'Device fingerprint metadata' })
  @IsOptional()
  @IsString()
  @Transform(extract('fingerprint'))
  fingerprint?: string;

  @ApiPropertyOptional({ description: 'User agent metadata' })
  @IsOptional()
  @IsString()
  @Transform(({ value, obj }) => value ?? obj?.user_agent ?? obj?.userAgent)
  userAgent?: string;

  @ApiPropertyOptional({ description: 'IP address metadata' })
  @IsOptional()
  @IsString()
  @Transform(({ value, obj }) => value ?? obj?.ip_address ?? obj?.ipAddress)
  ipAddress?: string;
}
