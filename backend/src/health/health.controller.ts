import { Controller, Get } from "@nestjs/common";

type HealthResponse = {
  readonly status: "ok";
};

@Controller("health")
export class HealthController {
  @Get()
  health(): HealthResponse {
    return { status: "ok" };
  }
}
