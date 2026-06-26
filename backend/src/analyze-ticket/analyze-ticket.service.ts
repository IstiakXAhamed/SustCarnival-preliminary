import { Injectable } from "@nestjs/common";
import { classifyCase } from "../reasoning/case-classifier";
import { evaluateEvidence } from "../reasoning/evidence-evaluator";
import { routeCase } from "../reasoning/routing";
import { matchTransaction } from "../reasoning/transaction-matcher";
import {
  buildAgentSummary,
  buildCustomerReply,
  buildNextAction
} from "../safety/reply-templates";
import { ensureSafeText } from "../safety/safety-checker";
import type { AnalyzeTicketRequest, AnalyzeTicketResponse } from "../reasoning/types";

@Injectable()
export class AnalyzeTicketService {
  analyze(input: AnalyzeTicketRequest): AnalyzeTicketResponse {
    try {
      const classification = classifyCase(input);
      const transactions = input.transaction_history ?? [];
      const match = matchTransaction(
        input.complaint,
        classification.case_type,
        transactions
      );
      const verdict = evaluateEvidence(
        classification.case_type,
        match,
        transactions
      );
      const routing = routeCase(
        classification.case_type,
        verdict,
        match.transaction,
        match.ambiguous
      );
      const replyInput = {
        request: input,
        case_type: classification.case_type,
        evidence_verdict: verdict,
        transaction: match.transaction
      };

      return {
        ticket_id: input.ticket_id,
        relevant_transaction_id: match.transaction?.transaction_id ?? null,
        evidence_verdict: verdict,
        case_type: classification.case_type,
        severity: routing.severity,
        department: routing.department,
        agent_summary: ensureSafeText(buildAgentSummary(replyInput)),
        recommended_next_action: ensureSafeText(buildNextAction(replyInput)),
        customer_reply: ensureSafeText(buildCustomerReply(replyInput)),
        human_review_required: routing.human_review_required,
        confidence: match.ambiguous ? 0.65 : confidenceFor(verdict),
        reason_codes: [
          ...classification.reason_codes,
          ...match.reason_codes,
          verdict
        ]
      };
    } catch (error) {
      // Safe fallback response to prevent application crash or 5xx leaks
      return {
        ticket_id: input?.ticket_id ?? "UNKNOWN",
        relevant_transaction_id: null,
        evidence_verdict: "insufficient_data",
        case_type: "other",
        severity: "low",
        department: "customer_support",
        agent_summary: "System encountered an unexpected processing error. Falling back to default routing.",
        recommended_next_action: "Ask the customer for clarification regarding their issue.",
        customer_reply: "We have received your request. Our support team will review the issue and contact you through official channels. Please do not share your PIN or OTP with anyone.",
        human_review_required: false,
        confidence: 0.5,
        reason_codes: ["internal_processing_fallback"]
      };
    }
  }
}

const confidenceFor = (verdict: string): number => {
  switch (verdict) {
    case "consistent":
      return 0.9;
    case "inconsistent":
      return 0.75;
    case "insufficient_data":
      return 0.6;
    default:
      return 0.6;
  }
};
