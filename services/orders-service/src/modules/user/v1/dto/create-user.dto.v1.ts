import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDtoV1 {
  @ApiProperty({ description: 'users email' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'users name' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  name: string;
}
