import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { OrderResolver } from '../orders/graphql/order.resolver';
import { DataLoaderFactory } from '../../common/graphql/loaders/data-loader';
import { LoadersModule } from 'src/common/graphql/loaders/loader.module';
import { Request, Response } from 'express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { graphqlOperationTimeoutPlugin } from 'src/common/graphql/graphql-operation-timeout.plugin';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: (
        dataLoaderFactory: DataLoaderFactory,
        configService: ConfigService,
      ) => {
        const raw = configService.get<string | number>(
          'GRAPHQL_OPERATION_TIMEOUT_MS',
        );
        const parsed =
          typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10);
        const timeoutMs =
          Number.isFinite(parsed) && parsed > 0 ? parsed : 30_000;

        return {
          autoSchemaFile: true,
          graphiql: true,
          introspection: true,
          plugins: [graphqlOperationTimeoutPlugin(timeoutMs)],
          context: ({ req, res }: { req: Request; res: Response }) => ({
            req,
            res,
            loaders: dataLoaderFactory.createLoader(),
          }),
        };
      },
      imports: [LoadersModule, ConfigModule],
      inject: [DataLoaderFactory, ConfigService],
    }),
  ],
})
export class AppGraphqlModule {}
