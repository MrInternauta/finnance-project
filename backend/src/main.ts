import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api', { exclude: []});
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //Remove not declared fields
      forbidNonWhitelisted: true, //Send a error with not declared fields
      transform: true, //Convert primitives (query strings, params) to the declared types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  ); //Activate pipe validator

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('Finnance API')
    .setDescription('Personal finance tracking API')
    .setVersion('1.0')
    //.addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // CORS_ORIGINS (comma-separated) restricts allowed origins; unset keeps the permissive default.
  // Capacitor builds need `capacitor://localhost` and `http://localhost` in the list.
  const corsOrigins = process.env.CORS_ORIGINS?.split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
  if (corsOrigins?.length) {
    app.enableCors({ origin: corsOrigins });
  } else {
    app.enableCors();
  }
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
