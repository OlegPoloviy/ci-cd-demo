import { ConfigService } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { OrdersService } from './orders.service';
import { OrdersEntity } from './orders.entity';
import { OrderItemEntity } from './order-item.entity';
import { Product } from '../products/products.entity';
import { ProcessedMessagesEntity } from './processed-message.entity';
import { OrderStatus } from '../../constants';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { UserEntity } from '../user/user.entity';

type ProcessedRepoMock = {
  insert: jest.Mock<Promise<void>, [Partial<ProcessedMessagesEntity>]>;
};

type OrderRepoMock = {
  findOne: jest.Mock<Promise<OrdersEntity>, [unknown]>;
  save: jest.Mock<Promise<OrdersEntity>, [OrdersEntity]>;
};

type ProductRepoMock = {
  createQueryBuilder: jest.Mock;
  save: jest.Mock<Promise<Product[]>, [Product[]]>;
};

type OrderItemRepoMock = {
  save: jest.Mock<Promise<OrderItemEntity[]>, [OrderItemEntity[]]>;
};

describe('OrdersService', () => {
  const makeService = (dataSource: DataSource) =>
    new OrdersService(
      dataSource,
      {} as RabbitmqService,
      {} as Repository<OrdersEntity>,
      {} as Repository<OrderItemEntity>,
      {} as Repository<Product>,
      {} as Repository<UserEntity>,
      {} as Repository<ProcessedMessagesEntity>,
      { getService: jest.fn() } as unknown as ClientGrpc,
      { get: jest.fn() } as unknown as ConfigService,
    );

  it('processes queued order by reserving stock and marking it as processed', async () => {
    const product = {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Keyboard',
      price: 50,
      stock: 5,
    } as Product;

    const order = {
      id: '22222222-2222-2222-2222-222222222222',
      status: OrderStatus.PENDING,
      processedAt: null,
      items: [
        {
          productId: product.id,
          quantity: 2,
          priceAtPurchase: '0',
        } as OrderItemEntity,
      ],
    } as OrdersEntity;

    const processedRepo: ProcessedRepoMock = {
      insert: jest.fn().mockResolvedValue(undefined),
    };
    const orderRepo: OrderRepoMock = {
      findOne: jest.fn().mockResolvedValue(order),
      save: jest.fn().mockImplementation(async (entity) => entity),
    };
    const productRepo: ProductRepoMock = {
      createQueryBuilder: jest.fn().mockReturnValue({
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([product]),
      }),
      save: jest.fn().mockResolvedValue([product]),
    };
    const orderItemRepo: OrderItemRepoMock = {
      save: jest.fn().mockResolvedValue(order.items),
    };
    const manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === ProcessedMessagesEntity) return processedRepo;
        if (entity === OrdersEntity) return orderRepo;
        if (entity === Product) return productRepo;
        if (entity === OrderItemEntity) return orderItemRepo;
        const name =
          typeof entity === 'function' ? entity.name : 'unknown entity';
        throw new Error(`Unexpected repository: ${name}`);
      }),
    } as unknown as EntityManager;
    const dataSource = {
      transaction: jest.fn((callback: (manager: EntityManager) => unknown) =>
        callback(manager),
      ),
    } as unknown as DataSource;
    const service = makeService(dataSource);

    const result = await service.processOrderFromQueueIdempotent({
      messageId: '33333333-3333-3333-3333-333333333333',
      orderId: order.id,
      attempt: 0,
    });

    expect(result).toEqual({ order, alreadyProcessed: false });
    expect(processedRepo.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: '33333333-3333-3333-3333-333333333333',
        orderId: order.id,
        handler: 'orders.process',
        processedAt: expect.any(Date),
      }),
    );
    expect(product.stock).toBe(3);
    expect(order.items[0].priceAtPurchase).toBe(String(product.price));
    expect(order.status).toBe(OrderStatus.PROCESSED);
    expect(order.processedAt).toBeInstanceOf(Date);
    expect(productRepo.save).toHaveBeenCalledWith([product]);
    expect(orderItemRepo.save).toHaveBeenCalledWith(order.items);
    expect(orderRepo.save).toHaveBeenCalledWith(order);
  });
});
