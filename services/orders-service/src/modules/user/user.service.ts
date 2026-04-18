import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDtoV1 } from './v1/dto/create-user.dto.v1';
import { UserEntity } from './user.entity';
import { UserDtoV2 } from './v2/dto/user.dto.v2';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileEntity } from './profile.entity';
import * as bcrypt from 'bcrypt';
import { AuditService } from 'src/common/audit/audit.service';
import { AuthUser } from '../auth/types/auth.types';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profilesRepository: Repository<ProfileEntity>,
    private readonly auditService: AuditService,
  ) {}

  async getAll(limit?: number) {
    const data =
      limit !== undefined && limit >= 0
        ? await this.usersRepository.find({ take: limit })
        : await this.usersRepository.find();

    const count = await this.usersRepository.count();

    return { count, data };
  }

  async addUserV1(dto: CreateUserDtoV1) {
    const newUser = this.usersRepository.create({
      ...dto,
    } as Partial<UserEntity>);

    return await this.usersRepository.save(newUser);
  }

  async deleteUser(id: string) {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      return { ok: false, message: 'User not found' };
    }
    return { ok: true };
  }

  async addUserV2(dto: UserDtoV2) {
    let passwordHash: string | null = null;

    if (dto.password) {
      const salt = await bcrypt.genSalt();
      passwordHash = await bcrypt.hash(dto.password, salt);
    }

    let profileEntity: ProfileEntity | null = null;

    if (dto.profile) {
      const newProfile = this.profilesRepository.create(dto.profile);
      profileEntity = await this.profilesRepository.save(newProfile);
    }

    const newUser = this.usersRepository.create({
      email: dto.email,
      name: dto.name || dto.email.split('@')[0],
      passwordHash: passwordHash,
      profile: profileEntity,
    });

    return await this.usersRepository.save(newUser);
  }

  async getUserById(id: string) {
    return this.usersRepository.findOne({ where: { id } });
  }

  async updateRoles(id: string, roles: string[], actor?: AuthUser) {
    const existingUser = await this.usersRepository.findOne({ where: { id } });

    if (!existingUser) {
      this.auditService.log({
        action: 'user.roles.update',
        actorId: actor?.sub ?? null,
        actorRoles: actor?.roles ?? [],
        actorScopes: actor?.scopes ?? [],
        targetType: 'user',
        targetId: id,
        outcome: 'failure',
        reason: 'user_not_found',
        metadata: {
          nextRoles: roles,
        },
      });
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.usersRepository.update(id, { roles });

    this.auditService.log({
      action: 'user.roles.update',
      actorId: actor?.sub ?? null,
      actorRoles: actor?.roles ?? [],
      actorScopes: actor?.scopes ?? [],
      targetType: 'user',
      targetId: id,
      outcome: 'success',
      metadata: {
        previousRoles: existingUser.roles ?? [],
        nextRoles: roles,
      },
    });

    return { message: 'Roles updated successfully' };
  }
}
