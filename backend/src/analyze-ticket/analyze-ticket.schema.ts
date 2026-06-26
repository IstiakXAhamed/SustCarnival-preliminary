import { z } from "zod";
import {
  CHANNEL_VALUES,
  LANGUAGE_VALUES,
  TRANSACTION_STATUS_VALUES,
  TRANSACTION_TYPE_VALUES,
  USER_TYPE_VALUES
} from "../reasoning/constants";

const transactionEntrySchema = z.object({
  transaction_id: z.string().min(1),
  timestamp: z.string().min(1),
  type: z.enum(TRANSACTION_TYPE_VALUES),
  amount: z.number(),
  counterparty: z.string().min(1),
  status: z.enum(TRANSACTION_STATUS_VALUES)
});

export const analyzeTicketSchema = z.object({
  ticket_id: z.string({ required_error: "ticket_id is required" }).min(1),
  complaint: z.string({ required_error: "complaint is required" }).min(1),
  language: z.enum(LANGUAGE_VALUES).optional(),
  channel: z.enum(CHANNEL_VALUES).optional(),
  user_type: z.enum(USER_TYPE_VALUES).optional(),
  campaign_context: z.string().optional(),
  transaction_history: z.array(transactionEntrySchema).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});
