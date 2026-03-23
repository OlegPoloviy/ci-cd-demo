import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { GetProductFilterDto } from './get-product-filter.dto';
import { Product } from './products.entity';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('top')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get top expensive products' })
  @ApiResponse({
    status: 200,
    description: 'List of products',
    type: Product,
    isArray: true,
  })
  getTop(@Query() dto: GetProductFilterDto): Promise<Product[]> {
    return this.productsService.getTopExpensiveProducts(dto);
  }
}
