import { Module } from "@nestjs/common";
import { AnalyzeTicketModule } from "./analyze-ticket/analyze-ticket.module";
import { HealthController } from "./health/health.controller";

@Module({
  imports: [AnalyzeTicketModule],
  controllers: [HealthController]
})
export class AppModule {}
