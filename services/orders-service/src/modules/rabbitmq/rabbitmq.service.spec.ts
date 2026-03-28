import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RabbitmqService } from './rabbitmq.service';

describe('RabbitmqService', () => {
  let service: RabbitmqService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitmqService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest
              .fn()
              .mockReturnValue('amqp://guest:guest@127.0.0.1:5672'),
            get: jest.fn().mockReturnValue('10'),
          },
        },
      ],
    }).compile();

    service = module.get<RabbitmqService>(RabbitmqService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
