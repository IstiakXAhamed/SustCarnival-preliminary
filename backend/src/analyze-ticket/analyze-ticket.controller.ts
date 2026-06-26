import { Body, Controller, Post } from "@nestjs/common";
import { AnalyzeTicketPipe } from "./analyze-ticket.pipe";
import { AnalyzeTicketService } from "./analyze-ticket.service";
import type {
  AnalyzeTicketRequest,
  AnalyzeTicketResponse
} from "../reasoning/types";

@Controller("analyze-ticket")
export class AnalyzeTicketController {
  constructor(private readonly analyzeTicketService: AnalyzeTicketService) {}

  @Post()
  analyze(
    @Body(new AnalyzeTicketPipe()) request: AnalyzeTicketRequest
  ): AnalyzeTicketResponse {
    return this.analyzeTicketService.analyze(request);
  }
}
