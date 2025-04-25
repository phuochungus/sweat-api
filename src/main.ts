import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/exception-filters/http-exception-filter';
import * as admin from 'firebase-admin';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Initialize Firebase Admin
  const firebaseConfig = configService.get('firebase');
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
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
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
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  
  // Start the server
  const port = configService.get<number>('port') || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation available at: ${await app.getUrl()}/api-docs`);
}

bootstrap();
