import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel, Connection, ConsumeMessage, Options } from 'amqplib';
import * as amqp from 'amqplib';

export type RabbitConsumeHandler = (
  msg: ConsumeMessage,
  channel: Channel,
) => Promise<void>;

@Injectable()
export class RabbitmqService implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(RabbitmqService.name);
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  constructor(private readonly configService: ConfigService) {}

  getChannel() {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not initialized');
    }
    return this.channel;
  }

  async onModuleInit() {
    await this.connect();
  }

  private async connect() {
    const url = this.configService.getOrThrow<string>('RABBITMQ_URL');
    const prefetch = Number(
      this.configService.get('RABBITMQ_PREFETCH') ?? '10',
    );

    try {
      const client = await amqp.connect(url);

      client.on('error', (err) =>
        this.logger.error('RabbitMQ connection error', err),
      );
      client.on('close', () => this.logger.warn('RabbitMQ connection closed'));

      const ch = await client.createChannel();
      await ch.prefetch(prefetch);

      this.connection = client;
      this.channel = ch;

      await this.assertInfrastructure();
      this.logger.log(`RabbitMQ connected (prefetch=${prefetch})`);
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel?.close();
    } catch (e) {
    } finally {
      await this.connection?.close();
    }
  }

  private async assertInfrastructure() {
    const ch = this.getChannel();

    await ch.assertExchange('dlx.exchange', 'direct', { durable: true });
    await ch.assertQueue('orders.dlq', { durable: true });
    await ch.bindQueue('orders.dlq', 'dlx.exchange', 'orders.dlq');

    await ch.assertQueue('orders.process', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'dlx.exchange',
        'x-dead-letter-routing-key': 'orders.dlq',
      },
    });
  }

  publish(queue: string, payload: any, options: Options.Publish = {}) {
    const ch = this.getChannel();
    return ch.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
      contentType: 'application/json',
      ...options,
    });
  }

  async consume(queue: string, hadler: RabbitConsumeHandler) {
    const ch = this.getChannel();
    await ch.consume(queue, async (msg) => {
      try {
        await hadler(msg, ch);
      } catch (error) {
        this.logger.error('Error in consume (handler threw)', error);
        try {
          ch.nack(msg, false, false);
        } catch (nackErr) {
          this.logger.error('Nack failed', nackErr);
        }
      }
    });
  }
}
