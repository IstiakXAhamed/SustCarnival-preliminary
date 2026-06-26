import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import type { Response } from "express";

type ErrorBody = {
  readonly statusCode: number;
  readonly error: string;
  readonly message: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const stringField = (
  value: Record<string, unknown>,
  key: string,
  fallback: string
): string => {
  const field = value[key];
  return typeof field === "string" ? field : fallback;
};

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = toErrorBody(exception);
    response.status(body.statusCode).json(body);
  }
}

const toErrorBody = (exception: unknown): ErrorBody => {
  if (exception instanceof HttpException) {
    const statusCode = exception.getStatus();
    const rawResponse = exception.getResponse();
    if (typeof rawResponse === "string") {
      return { statusCode, error: exception.name, message: rawResponse };
    }
    if (isRecord(rawResponse)) {
      return {
        statusCode,
        error: stringField(rawResponse, "error", exception.name),
        message: stringField(rawResponse, "message", "Request failed")
      };
    }
  }
  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    error: "Internal Server Error",
    message: "Internal server error"
  };
};
