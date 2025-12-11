import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { AlertStatus } from '../entities/alert.entity';

export class UpdateAlertDto {
  @ApiPropertyOptional({ enum: AlertStatus, description: 'Alert status' })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;
}
