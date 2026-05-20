import { NestFactory } from '@nestjs/core';
import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ApiExceptionFilter } from './common/http/api-exception.filter.js';
import { requestIdMiddleware } from './common/http/request-id.middleware.js';
import type { Request, Response } from 'express';

let app: NestExpressApplication;

async function createApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(requestIdMiddleware);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'The request contains invalid data',
          details: flattenValidationErrors(errors),
        }),
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Hotel Management Platform')
    .setDescription('API documentation for the Hotel Management Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('hotels', 'Hotel management endpoints')
    .addTag('hotel-users', 'Hotel user (staff/manager) management endpoints')
    .addTag('services', 'Hotel service management endpoints')
    .addTag('uploads', 'Image upload endpoints (Cloudinary)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.init();
  return app;
}

// Local development: listen on a port
async function bootstrap() {
  app = await createApp();
  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `🚀 Server running on http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `📚 Swagger docs at http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
}

// Vercel serverless handler export
export default async function handler(req: Request, res: Response) {
  if (!app) {
    app = await createApp();
  }
  const instance = app.getHttpAdapter().getInstance();
  instance(req, res);
}

// Only start listening when not in Vercel's serverless environment
if (!process.env.VERCEL) {
  void bootstrap();
}

function flattenValidationErrors(
  errors: ValidationError[],
  parent = '',
): { field: string; code: string; message: string }[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const current = Object.entries(error.constraints ?? {}).map(
      ([code, message]) => ({
        field,
        code,
        message,
      }),
    );
    return [
      ...current,
      ...flattenValidationErrors(error.children ?? [], field),
    ];
  });
}
