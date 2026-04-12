import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Patch,
  Param,
} from '@nestjs/common';
import { UserService } from '../user.service';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserV2ResponseDto } from './dto/user.reponse.dto';
import { JwtAuthGuard } from '../../../common/guards/auth.guard';
import { UserDtoV2 } from './dto/user.dto.v2';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/types/auth.types';
import { UserRoleGuard } from '../../../common/guards/user-role.guard';
import { UpdateRoleDto } from './dto/update-role.dto';
import { StrictThrottle } from 'src/common/decorators/throttle.decorators';

@ApiTags('User v2')
@Controller({ path: 'user', version: '2' })
export class UserControllerV2 {
  constructor(private readonly userService: UserService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create user (v2)',
    description:
      'Preferred input is `profile`. Legacy `name` is accepted for migration (deprecated).',
  })
  @ApiCreatedResponse({ type: UserV2ResponseDto })
  @ApiBearerAuth('access-token')
  @Post()
  async create(@Body() dto: UserDtoV2) {
    return this.userService.addUserV2(dto);
  }

  @ApiBearerAuth('access-token')
  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, UserRoleGuard)
  @ApiOperation({
    summary: 'Assign roles to user',
    description: 'Assign one or more roles to a user by their ID.',
  })
  @StrictThrottle()
  async assignRole(@Param('id') userId: string, @Body() dto: UpdateRoleDto) {
    return this.userService.updateRoles(userId, dto.roles);
  }
}
