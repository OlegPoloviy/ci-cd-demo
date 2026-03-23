import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class ProfileDto {
  @ApiProperty({ example: 'Ada' })
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty({ example: 'Lovelace' })
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}
