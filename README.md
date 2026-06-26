# QueueStorm Investigator

QueueStorm Investigator is a high-performance, backend-only API service designed to act as an automated copilot for support agents during peak customer complaint volumes. Built for the SUST CSE Carnival 2026 Hackathon preliminary round, the service processes incoming support tickets alongside customer transaction histories to produce structured, safe, and actionable insights.

The system classifies complaints, identifies matching transaction data, determines evidence consistency, routes issues to target departments, and drafts official, safety-compliant customer responses.

---

## Technical Stack & Architecture

- **Framework:** NestJS (Node.js 20+)
- **Language:** TypeScript
- **Containerization:** Docker (Alpine Linux-based multi-stage builds)
- **Deployment Target:** Railway
- **Validation & Parsing:** Zod

### Deterministic Rule-Based Architecture

Rather than calling external large language model (LLM) APIs, this application uses a deterministic rule-based engine written in TypeScript. This architectural decision guarantees:
- **Zero Schema Failures:** Eliminates the risk of output JSON format violations or unexpected field structures.
- **Sub-Millisecond Latency:** Response times are typically under 10 milliseconds, far outperforming the 5-second benchmark target.
- **100% System Availability:** Bypassing network dependencies prevents request failures caused by API outages, rate limits, or network timeouts.
- **Predictable Safety Control:** Reply safety rules are strictly enforced without relying on prompt stability.

### System Architecture Flowchart

```mermaid
graph TD
    Start[POST /analyze-ticket Request] --> Validate{Zod Schema Validation}
    Validate -->|Invalid schema| BadReq[400 Bad Request]
    Validate -->|Empty complaint| Unproc[422 Unprocessable Entity]
    Validate -->|Valid request| Classify[Case Classifier]
    
    Classify --> PhishCheck{Phishing/OTP Request Detected?}
    PhishCheck -->|Yes| PhishRoute[Case: phishing_or_social_engineering<br/>Severity: critical<br/>Dept: fraud_risk<br/>Review: true]
    PhishCheck -->|No| MatchTx{Transaction History Empty?}
    
    MatchTx -->|Yes| Insufficient[Verdict: insufficient_data<br/>Tx ID: null<br/>Review: false]
    MatchTx -->|No| DuplicateCheck{Is Case Duplicate Payment?}
    
    DuplicateCheck -->|Yes| DUPMatcher[Duplicate Pair Matcher]
    DuplicateCheck -->|No| GeneralMatcher[Scored Transaction Matcher]
    
    DUPMatcher --> DUPEval{Duplicate Pair Found?}
    DUPEval -->|Yes| DUPConsistent[Verdict: consistent<br/>Tx ID: Duplicate ID<br/>Review: true]
    DUPEval -->|No| DUPEvalSingle{Single Payment Exists?}
    DUPEvalSingle -->|Yes| DUPInconsistent[Verdict: inconsistent<br/>Tx ID: null<br/>Review: true]
    DUPEvalSingle -->|No| DUPInsufficient[Verdict: insufficient_data<br/>Tx ID: null<br/>Review: true]
    
    GeneralMatcher --> ScoreTx{Tied High Scores?}
    ScoreTx -->|Yes (Ambiguous)| AmbMatch[Verdict: insufficient_data<br/>Tx ID: null<br/>Review: false]
    ScoreTx -->|No Match| NoMatch[Verdict: insufficient_data<br/>Tx ID: null<br/>Review: false]
    ScoreTx -->|Single Clear Match| EvaluateEvidence[Evidence Evaluator]
    
    EvaluateEvidence --> WrongTransferCheck{Case: wrong_transfer?}
    WrongTransferCheck -->|Yes| WTCheck{Prior Transfers to Counterparty >= 3?}
    WTCheck -->|Yes| WTInconsistent[Verdict: inconsistent<br/>Severity: medium<br/>Review: true]
    WTCheck -->|No| WTConsistent[Verdict: consistent<br/>Severity: high<br/>Review: true]
    
    WrongTransferCheck -->|No| StatusCheck{Tx Status Matches Case?}
    StatusCheck -->|Yes| Consistent[Verdict: consistent<br/>Review: case dependent]
    StatusCheck -->|No| Inconsistent[Verdict: inconsistent<br/>Review: true]
    
    PhishRoute --> Templater[Reply Templater]
    DUPConsistent --> Templater
    DUPInconsistent --> Templater
    DUPInsufficient --> Templater
    AmbMatch --> Templater
    NoMatch --> Templater
    WTInconsistent --> Templater
    WTConsistent --> Templater
    Consistent --> Templater
    Inconsistent --> Templater
    Insufficient --> Templater
    
    Templater --> SafetyScan{Safety Filter Check Passed?}
    SafetyScan -->|Yes| SendResponse[Send Valid JSON Response]
    SafetyScan -->|No (Flagged request or promise)| FallbackReply[Replace customer_reply with Safe Warning Fallback]
    FallbackReply --> SendResponse
```

### Architectural Layering & Components

To ensure testability and predictable behavior, the service is built using the Clean Architecture pattern:

1. **API Routing & Validation Layer (`src/analyze-ticket/`):**
   - **`AnalyzeTicketController`**: The HTTP controller that exposes the endpoints. It ensures incoming payloads conform to the POST route contract.
   - **`AnalyzeTicketPipe`**: A validation interceptor powered by Zod. It parses request fields and rejects malformed payloads (triggering HTTP 400 or HTTP 422 for empty inputs).

2. **Reasoning Orchestrator (`src/analyze-ticket/analyze-ticket.service.ts`):**
   - **`AnalyzeTicketService`**: Serves as the transaction workflow manager. It queries the matching, classifier, and evidence sub-services, builds templates, and runs safety filters. Wrapped in a global `try-catch` wrapper, it prevents system crashes or stack trace exposure.

3. **Core Decision Engine (`src/reasoning/`):**
   - **`case-classifier.ts`**: Evaluates textual content against a comprehensive dictionary of terms (English/Bangla) to decide the ticket `case_type`. Also adjusts priorities based on metadata fields (e.g. `user_type` or `channel`).
   - **`transaction-matcher.ts`**: Finds the corresponding transaction. If a customer provides a specific transaction ID directly (e.g., `TXN-9101`), the engine applies a `+100` score boost to resolve ambiguity. Otherwise, it extracts numerals and scores entries based on types and dates.
   - **`evidence-evaluator.ts`**: Validates the user's claim. For example, duplicate payments check for double ledger lines, and wrong transfers check if there are 3+ prior transfers to the same recipient (indicating an established contact and flagging the verdict as `inconsistent`).
   - **`routing.ts`**: Matches decision inputs to specific departments, routes high-risk or ambiguous cases to human reviews, and assigns appropriate severity ratings.

4. **Safety & Output Formatting Layer (`src/safety/`):**
   - **`reply-templates.ts`**: Maps decision states to natural language templates (in English, Bangla, or mixed Banglish) to produce concise summaries, recommended actions, and safe customer replies.
   - **`phishing-detector.ts`**: A scanner that flags social engineering or OTP phishing attempts.
   - **`safety-checker.ts`**: A final safety filter that scans output responses, ensuring no credential request slips through and stripping unauthorized refund promises before responding.


---

## API Documentation

The service exposes the following HTTP endpoints on `0.0.0.0` over the configured `PORT` (default is `8000`).

### 1. Health Check
Checks if the API service is active and ready to process requests.

- **Method:** `GET`
- **Path:** `/health`
- **Response Code:** `200 OK`
- **Response Body:**
  ```json
  {
    "status": "ok"
  }
  ```

### 2. Analyze Ticket
Analyzes an incoming ticket to verify customer claims against recent transactions.

- **Method:** `POST`
- **Path:** `/analyze-ticket`
- **Headers:**
  - `Content-Type: application/json`
- **Request Body Fields:**
  - `ticket_id` (string, required): A unique identifier for the ticket.
  - `complaint` (string, required): The customer complaint text (supports English, Bangla, or mixed "Banglish").
  - `language` (string, optional): `"en"`, `"bn"`, or `"mixed"`.
  - `channel` (string, optional): `"in_app_chat"`, `"call_center"`, `"email"`, `"merchant_portal"`, or `"field_agent"`.
  - `user_type` (string, optional): `"customer"`, `"merchant"`, `"agent"`, or `"unknown"`.
  - `campaign_context` (string, optional): Campaign identifier.
  - `transaction_history` (array, optional): A list of recent transactions (typically 2 to 5 entries). Each entry contains:
    - `transaction_id` (string): Unique identifier for the transaction.
    - `timestamp` (string): ISO 8601 formatted date-time string.
    - `type` (string): `"transfer"`, `"payment"`, `"cash_in"`, `"cash_out"`, `"settlement"`, or `"refund"`.
    - `amount` (number): Value in BDT.
    - `counterparty` (string): Target receiver identifier (e.g., phone number or merchant ID).
    - `status` (string): `"completed"`, `"failed"`, `"pending"`, or `"reversed"`.
  - `metadata` (object, optional): Additional contextual information.

- **Response Body Fields:**
  - `ticket_id` (string): Echos the request's ticket ID.
  - `relevant_transaction_id` (string | null): The matching transaction ID, or `null` if none match the claim.
  - `evidence_verdict` (string): `"consistent"` (data supports the claim), `"inconsistent"` (data contradicts the claim), or `"insufficient_data"` (data is missing or ambiguous).
  - `case_type` (string): `"wrong_transfer"`, `"payment_failed"`, `"refund_request"`, `"duplicate_payment"`, `"merchant_settlement_delay"`, `"agent_cash_in_issue"`, `"phishing_or_social_engineering"`, or `"other"`.
  - `severity` (string): `"low"`, `"medium"`, `"high"`, or `"critical"`.
  - `department` (string): `"customer_support"`, `"dispute_resolution"`, `"payments_ops"`, `"merchant_operations"`, `"agent_operations"`, or `"fraud_risk"`.
  - `agent_summary` (string): A short summary of the case for support agents.
  - `recommended_next_action` (string): Suggested next step for resolving the ticket.
  - `customer_reply` (string): A safe, templated reply for the customer.
  - `human_review_required` (boolean): `true` if human escalation is needed.
  - `confidence` (number): Confidence score of the verdict (float between 0 and 1).
  - `reason_codes` (array of strings): Reasoning markers explaining the verdict.

- **HTTP Status Codes:**
  - `200`: Successful analysis matching the JSON output contract.
  - `400`: Malformed request JSON or missing required fields (`ticket_id` or `complaint`).
  - `422`: Schema matches but semantically invalid (e.g., empty complaint string).
  - `500`: Internal server error. Stack traces and environment details are stripped.

---

## Local Setup & Installation

### Prerequisites
- Node.js 20 or higher
- pnpm (package manager)

### Installation Steps

1. Navigate to the project backend directory:
   ```bash
   cd MainProject/backend
   ```

2. Enable Corepack to ensure the correct version of pnpm is available:
   ```bash
   corepack enable
   ```

3. Install dependencies:
   ```bash
   pnpm install --frozen-lockfile
   ```

### Running the Application

- **Development Mode (with live reload):**
  ```bash
   pnpm run start:dev
  ```

- **Production Build & Run:**
  ```bash
   pnpm run build
   pnpm run start:prod
  ```

- **Running Tests:**
  ```bash
   pnpm run test
  ```

- **Running End-to-End (E2E) Tests:**
  ```bash
   pnpm run test:e2e
  ```

---

## Docker fallback Configuration

For environments without Node.js installed locally, a lightweight Docker fallback is configured.

### Build the Docker Image
```bash
docker build -t queuestorm-investigator .
```

### Run the Docker Container
```bash
docker run -p 8000:8000 --env-file .env.example queuestorm-investigator
```

### Docker Specifications
- **Base Image:** `node:20-alpine` (multi-stage build)
- **Production Image Size:** Less than 150 MB (excluding developer dependencies and source files)
- **Port Binding:** Exposes port `8000` and binds to `0.0.0.0` to receive requests from all interfaces.
- **Security:** Run commands use non-interactive mode. No environment secrets are baked into the image layers.

---

## Railway & Deployment Settings

- The service binds to host `0.0.0.0` and listens to the environment-injected port `PORT`.
- To deploy on Railway, set the Root Directory config to `MainProject/backend` or include the `railway.json` configuration file at the repository root.
- Environment variables must be set using the Railway dashboard interface. Do not commit a `.env` file containing live credentials to GitHub.

---

## Safety Logic & Guardrails

Security and safety compliance are enforced through deterministic output validation inside the service boundaries:

1. **No Sensitive Information Requests:** Under no circumstances will the customer reply ask for a PIN, OTP, password, or full credit card number. Even if the customer complaint requests verification details or undergoes adversarial prompt injections, the system filters out credential requests.
2. **No Unauthorized Reversals or Refunds:** The service acts as a copilot, not a financial decision-maker. It never promises immediate refunds or unblocking actions. Neutral wording is enforced (e.g., "any eligible amount will be returned through official channels" instead of "we will refund your money").
3. **Official Channel Direction:** Customer replies only direct the user to official company communication channels. They never advise contacting third-party phone numbers or addresses.
4. **Credential Protection Warnings:** For relevant cash-in, transfer, or phishing issues, the replies proactively include safety warnings reminding customers to keep their PINs and OTPs private.
5. **Prompt Injection Resilience:** Because the core matching and classification engines are written as deterministic rule sets in TypeScript, user-submitted ticket text cannot inject instructions to override safety controls or route configurations.

---

## Models Used

This service does **not** use any external AI/LLM API, local model, or machine learning model. The entire reasoning engine is a **deterministic rule-based system** written in TypeScript.

| Model | Location | Purpose | Why Chosen |
|-------|----------|---------|------------|
| None (rule-based engine) | `src/reasoning/` | All classification, transaction matching, evidence evaluation, and routing | Guarantees zero schema failures, sub-millisecond latency, 100% uptime, and predictable safety enforcement without API cost or rate-limit risk |

**Rationale:** The Problem Statement explicitly states "an LLM is not required to score well" and encourages rule-based solutions. A deterministic engine eliminates network dependencies, API quota/rate-limit risks, and unpredictable LLM outputs — all of which could cause schema violations or safety failures under judge harness load testing. The rule-based approach also satisfies the "cost-aware design" tie-breaker criterion (tie-breaker #5) with zero operational cost.

---

## Reasoning Engine Details

The service matches the ticket with the correct transaction and assesses evidence using the following steps:

1. **Phishing Check:** The engine scans the text for phishing keywords using an extensive bilingual (English/Bangla) keyword array. If detected, it immediately classifies the ticket as `phishing_or_social_engineering`, assigns it `critical` severity, routes it to `fraud_risk`, and requires human review.
2. **Duplicate Payment Detection:** If the transaction history contains two identical payments to the same counterparty within a 60-second window, the system automatically flags the second entry as the duplicate payment, routes to `payments_ops`, and requests human review.
3. **Transaction Matching:** The engine parses the complaint text for amounts (handling Bangla and English numerals) and maps them to the transaction history. It scores candidate transactions using amount matching, type matching, and temporal proximity. If the customer explicitly mentions the Transaction ID (e.g. `TXN-9101`) in the ticket, the engine applies a `+100` score boost to guarantee a direct match, resolving any amount-based ambiguities.
4. **Duplicate Payment Verification:** When verifying evidence for duplicate payments, the engine checks the transaction history ledger. If a duplicate pair is present, the verdict is `consistent`. If only a single payment exists, the double payment claim is contradicted, resulting in an `inconsistent` verdict. If no transaction matches, the verdict is `insufficient_data`.
5. **Established Pattern Check:** If a customer claims a transfer was sent to the wrong recipient, the engine counts the number of prior transfers to that recipient in the history. If there are 3 or more prior transactions to the same recipient, it flags the evidence verdict as `inconsistent` (suggesting an established connection) and keeps the severity at `medium` for human verification.


---

## Sample Request & Response

### Request Example (Wrong Transfer - SAMPLE-01)
`POST /analyze-ticket`
```json
{
  "ticket_id": "TKT-001",
  "complaint": "I sent 5000 taka to a wrong number around 2pm today. The number was supposed to be 01712345678 but I think I typed it wrong. The person isn't responding to my call. Please help me get my money back.",
  "language": "en",
  "channel": "in_app_chat",
  "user_type": "customer",
  "campaign_context": "boishakh_bonanza_day_1",
  "transaction_history": [
    {
      "transaction_id": "TXN-9101",
      "timestamp": "2026-04-14T14:08:22Z",
      "type": "transfer",
      "amount": 5000,
      "counterparty": "+8801719876543",
      "status": "completed"
    },
    {
      "transaction_id": "TXN-9087",
      "timestamp": "2026-04-13T18:12:00Z",
      "type": "cash_in",
      "amount": 10000,
      "counterparty": "AGENT-512",
      "status": "completed"
    }
  ]
}
```

### Response Example (Wrong Transfer - SAMPLE-01)
`200 OK`
```json
{
  "ticket_id": "TKT-001",
  "relevant_transaction_id": "TXN-9101",
  "evidence_verdict": "consistent",
  "case_type": "wrong_transfer",
  "severity": "high",
  "department": "dispute_resolution",
  "agent_summary": "TXN-9101 5000 BDT (transfer, completed). Case classified as wrong_transfer with consistent evidence.",
  "recommended_next_action": "Verify the transaction details and initiate the wrong-transfer dispute workflow per policy.",
  "customer_reply": "We have noted your concern about transaction TXN-9101. Please do not share your PIN or OTP with anyone. Our dispute team will review the case and contact you through official support channels.",
  "human_review_required": true,
  "confidence": 0.9,
  "reason_codes": [
    "wrong_transfer_claim",
    "transaction_match",
    "consistent"
  ]
}
```

---

## Postman Testing Instructions

1. Locate the `postman_collection.json` file in the root of the project.
2. Open Postman, click **Import**, and select `postman_collection.json`.
3. Set the collection variable `base_url` to match your deployed service (e.g., `http://localhost:8000` or your Railway app URL).
4. Run the requests in the collection:
   - **Health Check:** `GET /health`
   - **Wrong Transfer (Sample 1):** `POST /analyze-ticket`
   - **Phishing Attempt (Sample 5):** `POST /analyze-ticket`
   - **Bangla Cash-in (Sample 7):** `POST /analyze-ticket`

---

## Known Limitations & Edge Cases

- **Date Extraction limitations:** The rule-based time matcher depends on transaction timestamps and does not perform advanced NLP parsing for relative dates (e.g., "three days ago relative to the ticket's creation date").
- **Language Detection:** Classification is based on keyword detection. Complex multilingual tickets containing slang might route to the `other` case type if no direct matches are found.
- **Multiple Duplicate Claims:** The duplicate matcher checks for identical payments within a 60-second window. If a customer is charged three times in a row, it pairs them into two duplicates rather than treating all three as a single multi-charge thread.

---

## Confirmations

- [x] No real customer data is used in code, testing, or mock files (all transactions and complaints are synthetic).
- [x] No credentials or secret keys are committed to this repository.
