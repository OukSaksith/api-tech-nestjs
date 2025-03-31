import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { logger, LoggingInterceptor } from './config/loggingInterceptor';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalInterceptors(new LoggingInterceptor());
  logger.info('Starting Nest application...', 'NestFactory');
  await app.listen(process.env.PORT ?? 8000);
  logger.info('Nest application successfully started on Port : ' + (process.env.PORT ?? 8000),  'NestApplication');
}
bootstrap();
