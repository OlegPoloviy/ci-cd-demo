import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { OrderStatus } from 'src/constants';

@InputType()
export class OrderFilterInput {
  @Field(() => OrderStatus, { nullable: true })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
