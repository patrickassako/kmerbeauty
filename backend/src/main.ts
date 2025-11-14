import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  // CORS - Allow all origins in development for mobile testing
  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
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
