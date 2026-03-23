import { Reflector } from '@nestjs/core';
import { CanActivate, ForbiddenException, Injectable } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const userRoles = req.user?.roles || [];

    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
