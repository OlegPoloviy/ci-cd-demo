import {
  Field,
  Float,
  ID,
  Int,
  ObjectType,
  GraphQLISODateTime,
} from '@nestjs/graphql';

@ObjectType()
export class ProductModel {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  sku: string;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => Float)
  price: number;

  @Field(() => Int)
  stock: number;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt: Date;
}
