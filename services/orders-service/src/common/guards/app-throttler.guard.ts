import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    const type = context.getType<'http' | 'graphql' | 'ws'>();

    if (type === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context).getContext();
      return { req: gqlContext.req, res: gqlContext.res };
    }

    if (type === 'ws') {
      const client: any = context.switchToWs().getClient();
      const ip =
        client?.handshake?.address ??
        client?._socket?.remoteAddress ??
        client?.conn?.remoteAddress;

      // ThrottlerGuard expects req.ip. res isn't used for tracking.
      return { req: { ip }, res: {} };
    }

    return super.getRequestResponse(context);
  }
}
