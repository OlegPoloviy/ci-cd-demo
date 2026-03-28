import { Test, TestingModule } from '@nestjs/testing';
import { UserControllerV1 } from './v1/user.controller.v1';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserControllerV1;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserControllerV1],
      providers: [
        {
          provide: UserService,
          useValue: {
            getAll: jest.fn(),
            addUserV1: jest.fn(),
            deleteUser: jest.fn(),
            getUserById: jest.fn(),
            updateUserRole: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserControllerV1>(UserControllerV1);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
