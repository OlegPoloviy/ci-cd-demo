import {InputType, Field, Int } from '@nestjs/graphql';
import { IsInt, Min, IsOptional } from 'class-validator';

@InputType()
export class OrderPaginationInput {
  @Field(() => Int)
  @IsInt()
  @IsOptional()
  @Min(0)
  page: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Field(() => Int)
  limit: number;
}