import {
  IsEmail,
  IsString,
  IsOptional,
  ValidateIf,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProfileDto } from './profile.dto';

export class UserDtoV2 {
  @ApiProperty({ example: 'ada@lovelace.dev' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    description: 'New contract (preferred).',
    type: ProfileDto,
  })
  @IsOptional()
  @Type(() => ProfileDto)
  profile?: ProfileDto;

  @ApiPropertyOptional({
    description: 'Legacy input accepted for migration (deprecated).',
    example: 'Ada Lovelace',
  })
  @ValidateIf((o) => !o.profile)
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @IsString()
  @MinLength(2)
  @ApiPropertyOptional({
    description:
      'Password is required for new users, optional for existing users. If provided',
    type: String,
  })
  password?: string;
}
