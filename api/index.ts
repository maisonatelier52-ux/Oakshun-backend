import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../src/app.module';

let cachedServer: express.Express;

async function bootstrap() {
  if (!cachedServer) {
    const expressApp = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), { rawBody: true });
    
    // Logger middleware
    app.use((req: any, res: any, next: any) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });

    // Enable CORS
    app.enableCors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      exposedHeaders: ['Set-Cookie'],
    });

    // Enable global validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
      }),
    );

    await app.init();
    cachedServer = expressApp;
  }
  return cachedServer;
}

export default async (req: any, res: any) => {
  // Capture unhandled rejections that normally crash Vercel silently
  const errorHandler = (err: any) => {
    console.error('FATAL PROCESS ERROR:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Fatal Process Error',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
    }
  };

  process.once('uncaughtException', errorHandler);
  process.once('unhandledRejection', errorHandler);

  try {
    const server = await bootstrap();
    await new Promise((resolve) => {
      res.on('finish', resolve);
      res.on('close', resolve);
      server(req, res);
    });
  } catch (error) {
    console.error('FATAL ERROR DURING NESTJS INITIALIZATION:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  }
};
