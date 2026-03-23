import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentsEntity } from './entities/payments.entity';
import { Repository } from 'typeorm';
import { AuthorizePaymentDto } from './dto/authorize-payment.dto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

@Injectable()
export class PaymentsServiceService {
  constructor(
    @InjectRepository(PaymentsEntity)
    private readonly paymentsRepo: Repository<PaymentsEntity>,
  ) {}

  async authorize(payload: AuthorizePaymentDto) {
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

    return {
      paymentId: saved.id,
      paymentStatus: 1,
    };
  }

  async getPaymentStatus(payload: { paymentId?: string; payment_id?: string }) {
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

    return {
      paymentId: payment.id,
      paymentStatus: payment.status,
    };
  }
}
