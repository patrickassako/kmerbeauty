import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
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
