import {ObjectType, Field, Int} from '@nestjs/graphql';
import { OrderModel } from '../graphql/order.model';

@ObjectType()
export class OrdersResponse {
  @Field(() => [OrderModel])
  items: OrderModel[];

  @Field(() => Int)
  total: number;
}