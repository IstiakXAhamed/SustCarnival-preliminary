import {
  BadRequestException,
  PipeTransform,
  UnprocessableEntityException
} from "@nestjs/common";
import { ZodError } from "zod";
import { analyzeTicketSchema } from "./analyze-ticket.schema";
import type { AnalyzeTicketRequest } from "../reasoning/types";

export class AnalyzeTicketPipe
  implements PipeTransform<unknown, AnalyzeTicketRequest>
{
  transform(value: unknown): AnalyzeTicketRequest {
    const result = analyzeTicketSchema.safeParse(value);
    if (result.success) {
      return result.data;
    }
    throw toHttpException(result.error);
  }
}

const toHttpException = (error: ZodError): BadRequestException => {
  const emptyComplaint = error.issues.some(
    (issue) => issue.path.join(".") === "complaint" && issue.code === "too_small"
  );
  if (emptyComplaint) {
    throw new UnprocessableEntityException("complaint must not be empty");
  }
  return new BadRequestException("invalid analyze-ticket request");
};
