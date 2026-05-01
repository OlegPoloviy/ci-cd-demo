import { NestFactory } from '@nestjs/core';
import { RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RequestContextMiddleware } from './common/middlewares/request-context.middleware';
import { RequestIdMiddleware } from './common/middlewares/request-id.middleware';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    credentials: false,
  });

  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
  app.enableVersioning({ type: VersioningType.URI });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(new RequestIdMiddleware().use);
  app.use(new RequestContextMiddleware().use);

  // GraphiQL (in this project) loads assets from CDN (unpkg), which is blocked by
  // Helmet's default Content-Security-Policy. Keep Helmet defaults for the API,
  // but disable CSP specifically for the GraphQL UI route.
  const helmetDefault = helmet();
  const helmetNoCsp = helmet({ contentSecurityPolicy: false });
  app.use((req, res, next) => {
    const url = req.originalUrl ?? req.url ?? '';
    if (url.startsWith('/graphql') || url.startsWith('/api/graphql')) {
      return helmetNoCsp(req, res, next);
    }
    return helmetDefault(req, res, next);
  });

  app.useGlobalFilters(new AllExceptionFilter());
  const config = new DocumentBuilder()
    .setTitle('RabbitMQ')
    .setDescription('RabbitMQ learning project')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  const port = process.env.PORT ?? 3000;
  const server = await app.listen(port);

  const rawTimeout = process.env.HTTP_SERVER_TIMEOUT_MS;
  const parsedTimeout =
    rawTimeout == null ? NaN : parseInt(String(rawTimeout), 10);
  const timeoutMs =
    Number.isFinite(parsedTimeout) && parsedTimeout > 0
      ? parsedTimeout
      : 65_000;

  server.setTimeout(timeoutMs);
  server.headersTimeout = timeoutMs + 1_000;
  server.requestTimeout = timeoutMs + 1_000;
}

bootstrap();
