import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  WsResponse,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import {
  OnModuleInit,
  OnModuleDestroy,
  UnauthorizedException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Observable, from, map, interval, Subscription } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../auth/types/auth.types';
import { OrderTrackingEventsService } from '../order-tracking/order-tracking-events.service';
import { getTokenFromHandshake } from 'src/common/utils/getTokenFromHandshake';
import { OrdersService } from '../orders/orders.service';
import { OrderTrackingService } from '../order-tracking/order-tracking.service';
import { WsUser } from 'src/common/decorators/ws-user.decorator';

type RealtimeClientData = {
  user?: JwtPayload;
  subscribeCalls?: number[];
};

type CourierLocationUpdateBody = {
  orderId: string;
  lat: number;
  lng: number;
};

@WebSocketGateway({ namespace: 'delivery', cors: { origin: true } })
export class DeliveryGateway
  implements OnModuleDestroy, OnGatewayDisconnect, OnGatewayConnection
{
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(DeliveryGateway.name);
  private sub?: Subscription;

  constructor(
    private readonly jwtService: JwtService,
    private readonly orderEventTrackingService: OrderTrackingEventsService,
    private readonly ordersTrackingService: OrderTrackingService,
    private readonly ordersService: OrdersService,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    const token = getTokenFromHandshake(client);

    if (!token) {
      this.logger.warn('WS connection rejected: no token');
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      (client.data as RealtimeClientData).user = payload;
      (client.data as RealtimeClientData).subscribeCalls = [];
    } catch (err) {
      this.logger.warn(`WS auth failed: ${err?.message ?? String(err)}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const data = client.data as RealtimeClientData;
    if (data.subscribeCalls) {
      data.subscribeCalls.length = 0;
    }
  }

  onModuleDestroy() {
    this.sub?.unsubscribe();
  }

  @SubscribeMessage('courier_location_update')
  async updateCourierLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CourierLocationUpdateBody | string,
    @WsUser() user: JwtPayload,
  ) {
    const body: CourierLocationUpdateBody =
      typeof payload === 'string' ? JSON.parse(payload) : payload;

    const userFromData = (client.data as RealtimeClientData).user;
    this.logger.log(
      `courier_location_update: orderId=${body.orderId} user.sub=${user?.sub ?? userFromData?.sub ?? 'none'} roles=${user?.roles?.join(',') ?? userFromData?.roles?.join(',') ?? 'none'}`,
    );

    const effectiveUser = user ?? userFromData;
    if (!effectiveUser) {
      this.logger.warn('courier_location_update: no user on socket');
      throw new WsException('Unauthorized');
    }
    if (!effectiveUser.roles?.includes('courier')) {
      this.logger.warn(
        `courier_location_update: user ${effectiveUser.sub} is not courier`,
      );
      throw new WsException('Only couriers can update the delivery status!');
    }

    const isAssigned = await this.ordersService.isCourierAssignedToOrder(
      body.orderId,
      effectiveUser.sub,
    );
    this.logger.log(
      `courier_location_update: orderId=${body.orderId} isAssigned=${isAssigned}`,
    );

    if (!isAssigned) {
      throw new WsException('Not found');
    }

    const orderId = String(body.orderId ?? '').trim();
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      throw new WsException('Invalid lat/lng');
    }

    const updated = await this.ordersTrackingService.updateLocation(
      orderId,
      lat,
      lng,
      effectiveUser.sub,
    );
    this.logger.log(
      `courier_location_update: saved to DB orderId=${orderId} lat=${updated.lat} lng=${updated.lng}`,
    );

    const eventPayload = {
      orderId: orderId.trim(),
      lat: updated.lat,
      lng: updated.lng,
      lastUpdated: updated.lastUpdated?.toISOString?.() ?? updated.lastUpdated,
    };
    const room = `order:${orderId.trim()}`;
    const socketsInRoom = await this.server.in(room).fetchSockets();
    this.server.in(room).emit('location_updated', eventPayload);
    client.emit('location_updated', eventPayload);
    this.logger.log(
      `courier_location_update: emitted to room=${room} (${socketsInRoom.length} socket(s) in room) and to sender`,
    );
  }

  @SubscribeMessage('subscribeOrder')
  async handleOrderSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { orderId?: string } | string,
    @WsUser() user: JwtPayload,
  ) {
    let orderId: string;
    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload);
        orderId = parsed?.orderId ?? payload;
      } catch {
        orderId = payload;
      }
    } else {
      orderId = payload?.orderId;
    }
    if (!orderId || typeof orderId !== 'string') {
      this.logger.warn('subscribeOrder: missing orderId in payload');
      throw new WsException('orderId required');
    }
    orderId = orderId.trim();
    const effectiveUser = user ?? (client.data as RealtimeClientData).user;
    try {
      await this.ordersService.canSubscribeToOrder(orderId, effectiveUser);
      client.join(`order:${orderId}`);
      this.logger.log(`subscribeOrder: client joined order:${orderId}`);
      return { subscribed: true };
    } catch (err) {
      const message = err?.message ?? 'Subscription denied';
      this.logger.warn(
        `subscribeOrder denied userId=${effectiveUser?.sub} orderId=${orderId} reason=${message}`,
      );
      throw new WsException(message);
    }
  }

  @SubscribeMessage('unsubscribeOrder')
  async handleOrderUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { orderId?: string } | string,
  ) {
    let orderId: string;
    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload);
        orderId = parsed?.orderId ?? payload;
      } catch {
        orderId = payload;
      }
    } else {
      orderId = payload?.orderId;
    }
    if (orderId) {
      client.leave(`order:${orderId.trim()}`);
    }
    return { unsubscribed: true };
  }
}
