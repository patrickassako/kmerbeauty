import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase payload limit
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false, // Disabled to allow all properties - TODO: Add proper validation decorators
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS - Allow configured origins
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://kmerbeauty-web.vercel.app',
    'https://kmerbeauty.com',
    'https://www.kmerbeauty.com',
  ].filter(Boolean);

  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        // Allow Vercel preview deployments
        if (origin.includes('vercel.app') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
      }
      : true, // Allow all origins in development
    credentials: true,
  });

  // Préfixe API
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 KmerServices Backend running on http://localhost:${port}`);
  console.log(`📍 API available at http://localhost:${port}/api/v1`);
  console.log(`🇨🇲 Marché: Cameroun | Devise: XAF`);
}

bootstrap();
