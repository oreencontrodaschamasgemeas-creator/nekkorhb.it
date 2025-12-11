import { PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsArray, IsDateString } from 'class-validator';
import { CreateIncidentDto } from './create-incident.dto';
import { IncidentStatus } from '../entities/incident.entity';

export class UpdateIncidentDto extends PartialType(CreateIncidentDto) {
  @ApiProperty({ enum: IncidentStatus, required: false })
  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;

  @ApiProperty({
    example: ['user1-id', 'user2-id'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsOptional()
  assignees?: string[];

  @ApiProperty({
    example: '2024-12-20T12:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  slaDeadline?: string;

  @ApiProperty({
    example: [{ item: 'Verify device functionality', completed: true }],
    required: false,
  })
  @IsArray()
  @IsOptional()
  resolutionChecklist?: { item: string; completed: boolean }[];
}
