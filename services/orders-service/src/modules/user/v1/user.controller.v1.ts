import {
  Controller,
  Param,
  Get,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBasicAuth,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from '../user.service';
import { CreateUserDtoV1 } from './dto/create-user.dto.v1';
import { validate } from 'class-validator';
import { CustomBody } from '../../../common/decorators/body.decorator';
import { TestGuard } from '../../../common/guards/test.guard';

function CustomMethodDecorator() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const paramTypes = Reflect.getMetadata(
        'design:paramtypes',
        target,
        propertyKey,
      );

      if (paramTypes) {
        for (let i = 0; i < paramTypes.length; i++) {
          const ParamClass = paramTypes[i];
          const arg = args[i];

          if (
            ParamClass &&
            typeof ParamClass === 'function' &&
            ParamClass !== String &&
            ParamClass !== Number &&
            ParamClass !== Boolean
          ) {
            const dtoInstance = Object.assign(new ParamClass(), arg);
            const errors = await validate(dtoInstance);

            if (errors.length > 0) {
              throw new Error(
                `Validation failed: ${errors
                  .map((e) => Object.values(e.constraints || {}))
                  .flat()
                  .join(', ')}`,
              );
            }
          }
        }
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

@ApiTags('users v1')
@Controller({ path: 'user', version: '1' })
export class UserControllerV1 {
  constructor(private readonly userService: UserService) {}

  @UseGuards(TestGuard)
  @ApiBearerAuth('access-token')
  @Get('/:limit')
  @ApiOperation({ summary: 'Get users list' })
  @ApiParam({
    name: 'limit',
    type: Number,
    description: 'Maximum number of users to return',
    required: true,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'List of users returned successfully',
    type: CreateUserDtoV1,
    isArray: true,
  })
  getAll(@Param('limit') limit: number) {
    return this.userService.getAll(limit);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDtoV1 })
  @ApiResponse({
    status: 201,
    description: 'User created',
    type: CreateUserDtoV1,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  createUser(@Body() body: CreateUserDtoV1) {
    return this.userService.addUserV1(body);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID of the user to delete',
    required: true,
    example: 'some-uuid',
  })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
