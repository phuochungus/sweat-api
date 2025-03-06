import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import {
  name as pkgName,
  description as pkgDesc,
  version as pkgVersion,
} from '../package.json';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
    // .addGlobalParameters({
    //   in: 'header',
    //   required: false,
    //   name: 'x-api-key',
    // })
    // .addGlobalParameters({
    //   in: 'header',
    //   required: false,
    //   name: 'x-uid',
    // })
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { displayRequestDuration: true },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
