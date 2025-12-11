import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({ name: 'refresh_token' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value, obj }) => value ?? obj?.refresh_token ?? obj?.refreshToken)
  refreshToken: string;

  @ApiPropertyOptional({ name: 'client_id' })
  @IsOptional()
  @IsString()
  @Transform(({ value, obj }) => value ?? obj?.client_id ?? obj?.clientId)
  clientId?: string;
}
