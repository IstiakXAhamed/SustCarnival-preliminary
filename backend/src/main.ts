import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { HttpErrorFilter } from "./common/http-exception.filter";

const DEFAULT_PORT = 8000;

const portFromEnv = (): number => {
  const rawPort = process.env.PORT;
  if (rawPort === undefined || rawPort.trim() === "") {
    return DEFAULT_PORT;
  }
  const port = Number(rawPort);
  return Number.isInteger(port) && port > 0 ? port : DEFAULT_PORT;
};

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpErrorFilter());
  await app.listen(portFromEnv(), "0.0.0.0");
}

void bootstrap();
