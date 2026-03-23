import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum } from 'class-validator';
import { UserRole } from '../../../auth/types/auth.types';

export class UpdateRoleDto {
  @ApiProperty({
    enum: UserRole,
    isArray: true,
    example: [UserRole.ADMIN, UserRole.USER],
    description: 'Array of user roles to assign to the user',
  })
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles: UserRole[];
}
