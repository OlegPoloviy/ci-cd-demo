import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PaymentsServiceService } from './payments-service.service';
import { AuthorizePaymentDto } from './dto/authorize-payment.dto';

@Controller()
export class PaymentsGRPCController {
  private readonly logger = new Logger(PaymentsGRPCController.name);

  constructor(private readonly paymentsService: PaymentsServiceService) {}

  @GrpcMethod('Payments', 'Authorize')
  async authorize(payload: AuthorizePaymentDto) {
    this.logger.log(`Authorizing payment for order: ${payload.orderId}`);
    return await this.paymentsService.authorize(payload);
  }

  @GrpcMethod('Payments', 'GetPaymentStatus')
  async getStatus(payload: { paymentId?: string; payment_id?: string }) {
    const id = payload.payment_id ?? payload.paymentId;
    this.logger.log(`Getting status for payment: ${id}`);
    return await this.paymentsService.getPaymentStatus(payload);
  }
}
