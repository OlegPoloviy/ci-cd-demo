import { UserEntity } from "../../../modules/user/user.entity";
import { Product } from "../../../modules/products/products.entity";
import { OrderItemEntity } from "../../../modules/orders/order-item.entity";
import DataLoader from "dataloader";

export type Loaders = {
  userLoader: DataLoader<string, UserEntity>;
  productLoader: DataLoader<string, Product>;
  orderItemsLoader: DataLoader<string, OrderItemEntity[]>;
};

export type GraphQLContext = {
  loaders: Loaders;
  strategy: 'optimized' | 'simple';
};
