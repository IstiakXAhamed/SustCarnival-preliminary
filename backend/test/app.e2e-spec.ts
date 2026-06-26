import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module";
import { HttpErrorFilter } from "../src/common/http-exception.filter";
import { sampleCases } from "./sample-cases";

describe("QueueStorm API", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new HttpErrorFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns health status", async () => {
    const response = await request(app.getHttpServer()).get("/health").expect(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("analyzes public sample cases through HTTP", async () => {
    for (const sample of sampleCases) {
      const response = await request(app.getHttpServer())
        .post("/analyze-ticket")
        .send(sample.input)
        .expect(200);

      expect(response.body.ticket_id).toBe(sample.input.ticket_id);
      expect(response.body.relevant_transaction_id).toBe(
        sample.expected.relevant_transaction_id
      );
      expect(response.body.evidence_verdict).toBe(sample.expected.evidence_verdict);
      expect(response.body.case_type).toBe(sample.expected.case_type);
      expect(response.body.department).toBe(sample.expected.department);
    }
  });

  it("returns 400 for missing required fields", async () => {
    const response = await request(app.getHttpServer())
      .post("/analyze-ticket")
      .send({ complaint: "missing ticket id" })
      .expect(400);

    expect(response.body.message).toBe("invalid analyze-ticket request");
  });

  it("returns 422 for empty complaint", async () => {
    const response = await request(app.getHttpServer())
      .post("/analyze-ticket")
      .send({ ticket_id: "TKT-EMPTY", complaint: "" })
      .expect(422);

    expect(response.body.message).toBe("complaint must not be empty");
  });
});
