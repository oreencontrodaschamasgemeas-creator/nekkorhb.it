import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export class CreateAnnotationDto {
  @ApiProperty({ example: 'Investigated the issue and found root cause' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: { internalNote: true }, required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class AnnotationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  incidentId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
