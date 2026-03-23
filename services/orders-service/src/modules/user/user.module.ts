import { Module } from '@nestjs/common';
import { UserControllerV1 } from './v1/user.controller.v1';
import { UserService } from './user.service';
import { UserControllerV2 } from './v2/user.controller.v2';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { ProfileEntity } from './profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ProfileEntity])],
  controllers: [UserControllerV1, UserControllerV2],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
