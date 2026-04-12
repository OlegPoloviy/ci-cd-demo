import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

const WS_THROTTLE_KEY = 'ws-throttle';

type WsThrottleOptions = {
  limit: number;
  ttl: number;
};

export const WsThrottle = (limit: number, ttl: number) =>
  SetMetadata(WS_THROTTLE_KEY, { limit, ttl } satisfies WsThrottleOptions);

export const WsStrictThrottle = () => WsThrottle(5, 10_000);

@Injectable()
export class WsThrottleGuard implements CanActivate {
  private readonly store = new Map<string, number[]>();

  canActivate(context: ExecutionContext): boolean {
    const options = this.getThrottleOptions(context);
    if (!options) {
      return true;
    }

    const client = context.switchToWs().getClient<Socket>();
    const eventName = context.getHandler().name;
    const actorKey = this.getActorKey(client);
    const key = `${eventName}:${actorKey}`;
    const now = Date.now();
    const windowStart = now - options.ttl;

    const timestamps = (this.store.get(key) ?? []).filter(
      (timestamp) => timestamp > windowStart,
    );

    if (timestamps.length >= options.limit) {
      throw new WsException('Too many requests');
    }

    timestamps.push(now);
    this.store.set(key, timestamps);

    return true;
  }

  private getThrottleOptions(
    context: ExecutionContext,
  ): WsThrottleOptions | undefined {
    return Reflect.getMetadata(WS_THROTTLE_KEY, context.getHandler());
  }

  private getActorKey(client: Socket): string {
    const userId = client.data?.user?.sub;
    if (userId) {
      return `user:${userId}`;
    }

    const forwardedFor = client.handshake.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
      return `ip:${forwardedFor.split(',')[0].trim()}`;
    }

    return `ip:${client.handshake.address}`;
  }
}
