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
  const sendError = (err: any, prefix: string) => {
    console.error(prefix, err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: prefix,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      }));
    }
  };

  process.once('uncaughtException', (err) => sendError(err, 'Uncaught Exception'));
  process.once('unhandledRejection', (err) => sendError(err, 'Unhandled Rejection'));

  try {
    const server = await bootstrap();
    await new Promise((resolve, reject) => {
      if (typeof res.on === 'function') {
        res.on('finish', resolve);
        res.on('close', resolve);
      } else {
        // Fallback if Vercel strips EventEmitter
        resolve(true);
      }
      try {
        server(req, res);
      } catch (e) {
        reject(e);
      }
    });
  } catch (error) {
    sendError(error, 'Initialization Error');
  }
};
