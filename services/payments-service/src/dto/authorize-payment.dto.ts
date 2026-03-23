export class AuthorizePaymentDto {
  orderId: string;
  amount: number;
  currency: string;
  idempotencyKey?: string;
}
