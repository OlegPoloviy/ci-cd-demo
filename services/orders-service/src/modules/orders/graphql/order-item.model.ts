import {ObjectType, Field, ID, Int,Float } from '@nestjs/graphql';
import { OrderModel } from './order.model';
import {ProductModel} from '../../products/graphql/product.model';

@ObjectType()
export class OrderItemModel {
  @Field(() => ID)
  id: string;

  @Field(() => OrderModel)
  order: OrderModel;

  @Field(() => ProductModel)
  product: ProductModel;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  priceAtPurchase: number;
}