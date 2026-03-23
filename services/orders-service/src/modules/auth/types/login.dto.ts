import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @IsEmail()
  @ApiProperty({
    example: 'ada@lovelace.dev',
    description: 'The email of the user',
  })
  @IsString()
  email: string;

  @IsString()
  @ApiProperty({
    example: 'very secure password',
    description: 'The password of the user',
  })
  @MinLength(3)
  password: string;
}
