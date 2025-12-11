import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AuthorizeDto {
  @ApiProperty({ example: 'dashboard-client' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ enum: ['code'], default: 'code' })
  @IsIn(['code'])
  responseType: 'code' = 'code';

  @ApiPropertyOptional({ description: 'Space delimited scopes being requested' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ example: 'https://app.example.com/oauth/callback' })
  @IsOptional()
  @IsString()
  redirectUri?: string;

  @ApiPropertyOptional({ example: 'state-123' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'PKCE code challenge (if applicable)' })
  @IsOptional()
  @IsString()
  codeChallenge?: string;

  @ApiPropertyOptional({ enum: ['plain', 'S256'], default: 'S256' })
  @IsOptional()
  @IsString()
  codeChallengeMethod?: string;
}
