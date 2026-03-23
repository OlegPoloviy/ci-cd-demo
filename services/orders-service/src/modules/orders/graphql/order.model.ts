import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { OrderStatus } from '../../../constants';
import { OrderItemModel } from './order-item.model';
import { UserModel } from '../../user/graphql/user.model';

registerEnumType(OrderStatus, {
  name: 'OrderStatus',
});

@ObjectType()
export class OrderModel {
  @Field(() => ID)
  id: string;

  @Field(() => [OrderItemModel])
  items: OrderItemModel[];

  @Field(() => UserModel, { nullable: true })
  user?: UserModel;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
