import { UserRole } from '../../modules/auth/types/auth.types';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
