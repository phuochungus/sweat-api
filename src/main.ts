import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import {
  name as pkgName,
  description as pkgDesc,
  version as pkgVersion,
} from '../package.json';
import { ValidationPipe } from '@nestjs/common';
import * as firebaseKey from '../serviceAccountKey.json';
import * as admin from 'firebase-admin';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  admin.initializeApp({
    credential: admin.credential.cert(firebaseKey as any),
  });
  const options = new DocumentBuilder()
    .setTitle(pkgName)
    .setDescription(pkgDesc)
    .setVersion(pkgVersion)
    .addTag(pkgName, pkgDesc)
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    })
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { displayRequestDuration: true },
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
