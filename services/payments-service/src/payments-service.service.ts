import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentsEntity } from './entities/payments.entity';
import { Repository } from 'typeorm';
import { AuthorizePaymentDto } from './dto/authorize-payment.dto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import {
  recordPaymentDuration,
  recordPaymentError,
  recordPaymentRequest,
} from './payments.metrics';

@Injectable()
export class PaymentsServiceService {
  constructor(
    @InjectRepository(PaymentsEntity)
    private readonly paymentsRepo: Repository<PaymentsEntity>,
  ) {}

  async authorize(payload: AuthorizePaymentDto) {
    const startedAt = process.hrtime.bigint();
    let result: 'success' | 'idempotent_hit' | 'error' = 'error';

    try {
      if (!payload.orderId || !payload.amount) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Missing required fields',
        });
      }

      if (payload.idempotencyKey) {
        const existing = await this.paymentsRepo.findOne({
          where: { idempotencyKey: payload.idempotencyKey },
        });
        if (existing) {
          result = 'idempotent_hit';
          recordPaymentRequest('authorize', result);
          return {
            paymentId: existing.id,
            paymentStatus: existing.status,
          };
        }
      }

      const providerRef = `ref-${Math.random().toString(36).toUpperCase().slice(2, 10)}`;

      const payment = this.paymentsRepo.create({
        orderId: payload.orderId,
        amount: payload.amount,
        currency: payload.currency,
        idempotencyKey: payload.idempotencyKey,
        status: 'PAYMENT_STATUS_AUTHORIZED',
        providerRef,
      });

      const saved = await this.paymentsRepo.save(payment);
      result = 'success';
      recordPaymentRequest('authorize', result);

      return {
        paymentId: saved.id,
        paymentStatus: 1,
      };
    } catch (error) {
      const code = this.getErrorCode(error);
      recordPaymentRequest('authorize', 'error');
      recordPaymentError('authorize', code);
      throw error;
    } finally {
      recordPaymentDuration(
        'authorize',
        this.elapsedSeconds(startedAt),
        result,
      );
    }
  }

  async getPaymentStatus(payload: { paymentId?: string; payment_id?: string }) {
    const startedAt = process.hrtime.bigint();
    let result: 'success' | 'idempotent_hit' | 'error' = 'error';

    try {
      const id = payload.payment_id ?? payload.paymentId;
      if (!id) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'payment_id is required',
        });
      }
      const payment = await this.paymentsRepo.findOne({
        where: { id },
      });

      if (!payment) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Payment record not found',
        });
      }

      result = 'success';
      recordPaymentRequest('get_payment_status', result);

      return {
        paymentId: payment.id,
        paymentStatus: payment.status,
      };
    } catch (error) {
      const code = this.getErrorCode(error);
      recordPaymentRequest('get_payment_status', 'error');
      recordPaymentError('get_payment_status', code);
      throw error;
    } finally {
      recordPaymentDuration(
        'get_payment_status',
        this.elapsedSeconds(startedAt),
        result,
      );
    }
  }

  private elapsedSeconds(startedAt: bigint): number {
    return Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
  }

  private getErrorCode(error: unknown): string {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code != null
    ) {
      return String(error.code);
    }

    return 'UNKNOWN';
  }
}
