import { Resolver, ResolveField, Parent, Context } from '@nestjs/graphql';
import { OrderItemModel } from './order-item.model';
import { ProductModel } from '../../products/graphql/product.model';
import { ProductsService } from '../../products/products.service';
import { GraphQLContext } from 'src/common/graphql/loaders/loader.type';

@Resolver(() => OrderItemModel)
export class OrderItemResolver {
  constructor(private readonly productsService: ProductsService) {}

  @ResolveField(() => ProductModel, { nullable: true })
  async product(
    @Parent() orderItem: OrderItemModel,
    @Context() ctx: GraphQLContext,
  ) {
    // @ts-ignore
    if (!orderItem.productId) return null;

    if (ctx.strategy === 'optimized') {
      // @ts-ignore
      return ctx.loaders.productLoader.load(orderItem.productId);
    }

    // @ts-ignore
    return this.productsService.getProductById(orderItem.productId);
  }
}
