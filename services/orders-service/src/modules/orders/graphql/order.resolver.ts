import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrderModel } from './order.model';
import { OrdersResponse } from '../dto/order-response.dto';
import { OrderFilterInput } from '../dto/order-filter.input';
import { OrdersService } from '../orders.service';
import { OrderPaginationInput } from '../dto/order-pagination.input';
import { UserModel } from '../../user/graphql/user.model';
import { UserService } from '../../user/user.service';
import { OrderItemModel } from './order-item.model';
import { GraphQLContext } from 'src/common/graphql/loaders/loader.type';
import { StrictThrottle } from 'src/common/decorators/throttle.decorators';
import { GqlThrottlerGuard } from 'src/common/guards/gql-throttler.guard';

@UseGuards(GqlThrottlerGuard)
@Resolver(() => OrderModel)
export class OrderResolver {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly usersService: UserService,
  ) {}

  @Query(() => OrdersResponse)
  @StrictThrottle()
  getOrders(
    @Args('ordersFilter', { nullable: true }) filters: OrderFilterInput,
    @Args('pagination', { nullable: true }) pagination: OrderPaginationInput,
    @Context() ctx: GraphQLContext,
  ) {
    ctx.strategy = 'optimized';
    return this.ordersService.getOrders(pagination, filters);
  }

  @Query(() => OrdersResponse)
  @StrictThrottle()
  getOrdersSimple(
    @Args('ordersFilter', { nullable: true }) filters: OrderFilterInput,
    @Args('pagination', { nullable: true }) pagination: OrderPaginationInput,
    @Context() ctx: GraphQLContext,
  ) {
    ctx.strategy = 'simple';
    return this.ordersService.getOrders(pagination, filters);
  }

  @Query(() => OrderModel)
  getOrderById(@Args('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @ResolveField(() => UserModel, { nullable: true })
  async user(@Parent() order: OrderModel, @Context() ctx: GraphQLContext) {
    if (ctx.strategy === 'optimized') {
      // @ts-ignore
      return ctx.loaders.userLoader.load(order.userId);
    }
    // @ts-ignore
    return this.usersService.getUserById(order.userId);
  }

  @ResolveField(() => [OrderItemModel])
  async items(@Parent() order: OrderModel, @Context() ctx: GraphQLContext) {
    if (ctx.strategy === 'optimized') {
      return ctx.loaders.orderItemsLoader.load(order.id);
    }
    return this.ordersService.getOrderItems(order.id);
  }
}
