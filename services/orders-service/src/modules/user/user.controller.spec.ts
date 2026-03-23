import { Test, TestingModule } from '@nestjs/testing';
import { UserControllerV1 } from './v1/user.controller.v1';

describe('UserController', () => {
  let controller: UserControllerV1;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserControllerV1],
    }).compile();

    controller = module.get<UserControllerV1>(UserControllerV1);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
