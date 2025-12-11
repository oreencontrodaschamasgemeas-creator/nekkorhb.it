import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.EMAIL })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({ example: 'New incident alert' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'A new critical incident has been created' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ example: { incidentId: 'xxx-xxx' }, required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}
