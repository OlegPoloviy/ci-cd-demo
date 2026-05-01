import { NestFactory } from '@nestjs/core';
import { PaymentsServiceModule } from './payments-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(
    PaymentsServiceModule,
  );
  const config = appContext.get(ConfigService);

  const microserviceUrl =
    config.getOrThrow<string>('PAYMENTS_GRPC_BIND_URL') ||
    `0.0.0.0:${config.getOrThrow<number>('PAYMENTS_GRPC_PORT', 5022)}`;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaymentsServiceModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'payments.v1',
        protoPath: join(__dirname, '../../../contracts/proto/payments.proto'),
        url: microserviceUrl,
      },
    },
  );

  await app.listen();

  console.log(` Payments-service gRPC started on ${microserviceUrl}`);
}
bootstrap();
