import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app/app.module';

export async function createApp(
  expressAdapter: ExpressAdapter
): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, expressAdapter);

  app.enableCors();
  await app.init();
  return app;
}