import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import { GraphQLError } from 'graphql';

export function graphqlOperationTimeoutPlugin(
  timeoutMs: number,
): ApolloServerPlugin<any> {
  return {
    async requestDidStart() {
      const startedAt = Date.now();

      const listener: GraphQLRequestListener<any> = {
        async executionDidStart() {
          return {
            willResolveField() {
              if (Date.now() - startedAt > timeoutMs) {
                throw new GraphQLError('Operation timed out', {
                  extensions: {
                    code: 'OPERATION_TIMEOUT',
                    timeoutMs,
                  },
                });
              }
            },
          };
        },
      };

      return listener;
    },
  };
}
