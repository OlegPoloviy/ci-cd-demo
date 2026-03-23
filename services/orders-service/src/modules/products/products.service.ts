import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './products.entity';
import { GetProductFilterDto } from './get-product-filter.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async getTopExpensiveProducts(dto: GetProductFilterDto): Promise<Product[]> {
    const { minPrice, limit } = dto;

    return this.productsRepository
      .createQueryBuilder('product')

      .leftJoinAndSelect('product.images', 'image')
      .where('product.price >= :minPrice', { minPrice })
      .orderBy('product.price', 'DESC')
      .take(limit)
      .getMany();
  }

  async getProductById(id: string): Promise<Product> {
    return this.productsRepository.findOne({ where: { id } });
  }
}
