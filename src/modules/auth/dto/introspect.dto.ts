import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class IntrospectDto {
  @ApiProperty({ description: 'Access token to introspect' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value, obj }) => value ?? obj?.token)
  token: string;
}
