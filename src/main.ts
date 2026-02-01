import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Set up Handlebars as the view engine
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'public'));

  await app.listen(process.env.PORT || 3000);

  console.log(
    `Application is running on: http://localhost:${process.env.PORT || 3000}`,
  );
}

void bootstrap();
