import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../user/user.entity';
import { JwtPayload } from './types/auth.types';
import { LoginDto } from './types/login.dto';
import { AuditService } from 'src/common/audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async validateUser(email: string, password: string): Promise<UserEntity> {
    const existingUser = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();

    if (!existingUser || !existingUser.passwordHash) {
      this.auditService.log({
        action: 'auth.login',
        actorId: null,
        actorRoles: [],
        actorScopes: [],
        targetType: 'user',
        targetId: existingUser?.id ?? email,
        outcome: 'failure',
        reason: 'invalid_credentials',
        metadata: {
          email,
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(
      password,
      existingUser.passwordHash,
    );

    if (!isValidPassword) {
      this.auditService.log({
        action: 'auth.login',
        actorId: null,
        actorRoles: [],
        actorScopes: [],
        targetType: 'user',
        targetId: existingUser.id,
        outcome: 'failure',
        reason: 'invalid_credentials',
        metadata: {
          email,
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const { passwordHash, ...userWithoutPassword } = existingUser;

    return userWithoutPassword as UserEntity;
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles ?? [],
      scopes: user.scopes ?? [],
    };

    const accessToken = await this.jwtService.signAsync(payload);

    this.auditService.log({
      action: 'auth.login',
      actorId: user.id,
      actorRoles: user.roles ?? [],
      actorScopes: user.scopes ?? [],
      targetType: 'user',
      targetId: user.id,
      outcome: 'success',
    });

    return { accessToken };
  }
}
