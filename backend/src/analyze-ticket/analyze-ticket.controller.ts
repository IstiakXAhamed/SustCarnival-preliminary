import { Body, Controller, HttpCode, Inject, Post } from "@nestjs/common";
import { AnalyzeTicketPipe } from "./analyze-ticket.pipe";
import { AnalyzeTicketService } from "./analyze-ticket.service";
import type {
  AnalyzeTicketRequest,
  AnalyzeTicketResponse
} from "../reasoning/types";

@Controller("analyze-ticket")
export class AnalyzeTicketController {
  constructor(
    @Inject(AnalyzeTicketService)
    private readonly analyzeTicketService: AnalyzeTicketService
  ) {}

  @Post()
  @HttpCode(200)
  async analyze(
    @Body(new AnalyzeTicketPipe()) request: AnalyzeTicketRequest
  ): Promise<AnalyzeTicketResponse> {
    return this.analyzeTicketService.analyze(request);
  }
}
