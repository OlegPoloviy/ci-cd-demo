import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConsumeMessage, Channel } from 'amqplib';
import { OrdersService } from './orders.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { OrdersProcessMessage } from './orders-queue.type';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrdersProcessorService implements OnApplicationBootstrap {
  private readonly logger = new Logger(OrdersProcessorService.name);
  private readonly MAX_ATTEMPTS =
    this.configService.get<number>('RABBIT_RETRY_COUNT') ?? 3;
  private readonly RETRY_DELAY =
    this.configService.get<number>('RABBIT_RETRY_DELAY') ?? 1000;
  constructor(
    private readonly ordersService: OrdersService,
    private readonly rabbitmqService: RabbitmqService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('OrdersProcessorService initialized');
    await this.rabbitmqService.consume('orders.process', async (msg, ch) => {
      await this.handleMessage(msg, ch);
    });

    this.logger.log('Orders worker subscribed: orders.process');
  }

  private async handleMessage(msg: ConsumeMessage, ch: Channel) {
    let payload: OrdersProcessMessage;

    try {
      payload = JSON.parse(msg.content.toString());
    } catch (error) {
      this.logger.error(
        `Handle message failed: invalid JSON (result=dlq).`,
        error as Error,
      );
      ch.nack(msg, false, false);
      return;
    }

    const attempt = payload.attempt || 0;
    const messageId = payload.messageId;

    try {
      this.logger.log(
        `Handle message start: messageId=${messageId}, orderId=${payload.orderId}, attempt=${attempt}`,
      );

      const result =
        await this.ordersService.processOrderFromQueueIdempotent(payload);

      this.safeAck(ch, msg);

      if (result.alreadyProcessed) {
        this.logger.log(
          `Handle message result=success(idempotent): messageId=${messageId}, orderId=${payload.orderId}, attempt=${attempt}`,
        );
      } else {
        this.logger.log(
          `Handle message result=success: messageId=${messageId}, orderId=${payload.orderId}, attempt=${attempt}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Handle message result=error: messageId=${messageId}, orderId=${payload.orderId}, attempt=${attempt}, reason=${(error as any)?.message ?? error}`,
        (error as any)?.stack,
      );

      if (attempt < this.MAX_ATTEMPTS) {
        this.logger.log(
          `Handle message result=retry: messageId=${messageId}, orderId=${payload.orderId}, attempt=${attempt}, nextAttempt=${attempt + 1}`,
        );

        await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY));

        this.rabbitmqService.publish('orders.process', {
          ...payload,
          attempt: attempt + 1,
          messageId,
        });

        this.safeAck(ch, msg);
      } else {
        this.logger.error(
          `Handle message result=dlq: messageId=${messageId}, orderId=${payload.orderId}, attempt=${attempt}`,
        );

        this.safeNack(ch, msg);
      }
    }
  }

  private safeAck(ch: Channel, msg: ConsumeMessage): void {
    try {
      ch.ack(msg);
    } catch (e) {
      this.logger.error('Ack failed', e);
    }
  }

  private safeNack(ch: Channel, msg: ConsumeMessage): void {
    try {
      ch.nack(msg, false, false);
    } catch (e) {
      this.logger.error('Nack failed', e);
    }
  }
}
