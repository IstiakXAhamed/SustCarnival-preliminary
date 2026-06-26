import { Module } from "@nestjs/common";
import { AnalyzeTicketController } from "./analyze-ticket.controller";
import { AnalyzeTicketService } from "./analyze-ticket.service";

@Module({
  controllers: [AnalyzeTicketController],
  providers: [AnalyzeTicketService]
})
export class AnalyzeTicketModule {}
