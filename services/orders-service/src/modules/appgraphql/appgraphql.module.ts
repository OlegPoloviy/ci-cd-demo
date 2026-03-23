import { Module } from '@nestjs/common';
import {GraphQLModule} from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { OrderResolver} from '../orders/graphql/order.resolver';
import { DataLoaderFactory } from '../../common/graphql/loaders/data-loader';
import { LoadersModule } from 'src/common/graphql/loaders/loader.module';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory : (dataLoaderFactory: DataLoaderFactory) => ({
        autoSchemaFile: true,
        graphiql: true,
        introspection: true,
        context: () => ({
          loaders: dataLoaderFactory.createLoader(),
        }),
      }),
       imports: [LoadersModule],
      inject: [DataLoaderFactory],
    }),
  ],
})
export class AppGraphqlModule {}
