import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/exception-filters/http-exception-filter';
import * as admin from 'firebase-admin';
import 'dotenv/config';

import {
  Post,
  PostComment,
  PostReact,
  PostMedia,
  User,
  UserSetting,
  UserNotification,
  UserFriend,
  UserFriendRequest,
} from 'src/entities';

async function bootstrap() {
  const firebaseConfig = {
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  };
  if (firebaseConfig?.serviceAccount) {
    try {
      const serviceAccount = JSON.parse(firebaseConfig.serviceAccount);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
    }
  }

  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      colors: process.env.LOG_COLORS === 'true',
    }),
  });
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Initialize Firebase Admin

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Sweat Social API')
    .setDescription('API for the Sweat social media platform')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter Firebase JWT token',
        in: 'header',
      },
      'firebase-jwt',
    )
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: 'x-api-key',
    })
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: 'x-uid',
    })
    .addServer('http://localhost:3000', 'Local Development Server')
    .addServer('https://api.sweat-app.tech', 'Production Server')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [
      Post,
      PostComment,
      PostReact,
      PostMedia,
      User,
      UserSetting,
      UserNotification,
      UserFriend,
      UserFriendRequest,
    ],
  });
  SwaggerModule.setup('docs', app, document);

  // Start the server
  const port = configService.get<number>('port') || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation available at: ${await app.getUrl()}/docs`);
}

bootstrap();
