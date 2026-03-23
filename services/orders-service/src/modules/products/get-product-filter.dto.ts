import { IsOptional, IsInt, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetProductFilterDto {
  @ApiPropertyOptional({
    description: 'Minimum price filter',
    default: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number = 1000;

  @ApiPropertyOptional({
    description: 'Number of products to return',
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}
