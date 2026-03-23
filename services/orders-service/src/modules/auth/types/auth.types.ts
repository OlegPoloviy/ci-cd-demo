export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager',
  COURIER = 'courier',
}

export type JwtPayload = {
  sub: string;
  email: string;
  roles: string[];
  scopes: string[];
};

export type AuthUser = JwtPayload;
