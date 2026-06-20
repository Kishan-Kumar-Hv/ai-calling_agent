# Involynk AI Calling Platform
## Enterprise Architecture, Engineering & Go-To-Market Blueprint

**Prepared for:** Involynk — AI-Powered Multilingual Sales Calling Platform
**Audience:** Investors, Enterprise Customers, Engineering & Product Leadership
**Scope:** Architecture audit, production redesign, voice pipeline, multilingual AI, sales agent design, RAG, CRM integrations, security/compliance, observability, cost modeling, pricing strategy

---

## Table of Contents

1. Executive Summary
2. Phase 1 — Architecture Audit (Current/Proposed Baseline)
3. Phase 2 — Production Architecture Redesign
4. Phase 3 — Real-Time Voice Pipeline
5. Phase 4 — Multilingual AI Design
6. Phase 5 — AI Sales Agent Design
7. Phase 6 — Enterprise RAG Architecture
8. Phase 7 — CRM Integrations
9. Phase 8 — Security & Compliance
10. Phase 9 — Observability
11. Phase 10 — Cost Model
12. Phase 11 — Product Strategy / Pricing
13. Appendix — Technology Stack Summary

---

## 1. Executive Summary

Involynk is building an AI-native replacement for the human SDR (Sales Development Representative) function in India — a multilingual, voice-first sales agent capable of cold calling, qualifying leads, booking meetings, following up, and synchronizing every interaction into enterprise CRMs. The platform must operate at call-center scale (100,000+ calls/day, 10,000 concurrent sessions) while keeping conversational latency low enough (300–800ms) to feel human, and must do so across ten Indian languages with natural code-switching (e.g., Hindi-English "Hinglish").

This document is organized in two parts:

- **Part A (Phases 1–2):** An audit of the natural "v1" architecture a team would build first, followed by a complete production-grade redesign for multi-tenant SaaS scale.
- **Part B (Phases 3–11):** Deep technical designs for the voice pipeline, multilingual intelligence, the AI SDR "brain," RAG knowledge system, CRM integrations, security/compliance posture (DPDP/TRAI/DLT/GDPR), observability stack, cost modeling across four scale tiers, and SaaS pricing strategy.

**Headline numbers:**

| Metric | Target |
|---|---|
| Max end-to-end voice latency | 800ms (ideal 300–500ms) |
| Concurrent calls | 10,000 |
| Daily call volume | 100,000+ |
| Languages | 10 (EN, HI, KN, TE, TA, ML, MR, BN, GU, PA) |
| Availability SLA (Enterprise) | 99.95% |
| Cost per call (at 100K/day scale) | ₹3.80–₹6.50 (~$0.045–$0.078) depending on call duration & language mix |

---

# PHASE 1 — ARCHITECTURE AUDIT

This audits the architecture implied by the "About" document — a single-region stack with a telephony provider, an STT engine, an LLM, a TTS engine, CRM webhooks, and a basic analytics layer. This is the architecture most teams build first. We assess it layer by layer.

### 1.1 Telephony Layer

**Strengths**
- Likely built on a proven PSTN/SIP provider (Twilio, Plivo, Exotel, or Airtel IQ) — fast to integrate, good India coverage.
- Supports outbound dialing and call recording out of the box.

**Weaknesses**
- Single-provider dependency creates a hard SPOF for the entire revenue pipeline.
- No native support for concurrent-call autoscaling — most providers rate-limit outbound CPS (calls per second) by default tier.
- No jitter buffer / packet-loss compensation strategy documented.

**Risks**
- Telecom regulatory risk: unregistered outbound numbers will get blocked by TRAI's spam-filtering (AI/ML-based UCC detection) and DLT non-compliance will silently drop calls.
- Provider-side outage = 100% platform outage.

**Scalability Issues**
- Most telephony providers cap concurrent outbound channels per account; 10,000 concurrent calls requires explicit enterprise contracts and multiple number pools (CLI rotation) to avoid carrier throttling.

**Cost Risks**
- Per-minute PSTN costs in India range ₹0.30–₹0.60/min outbound mobile; at 100K calls/day × ~3 min avg = 300K minutes/day → ₹90K–₹180K/day if not optimized with route-based least-cost routing (LCR).

**Security Concerns**
- Call recordings stored without encryption-at-rest or lifecycle policy = compliance exposure.
- No mutual TLS/SRTP enforcement mentioned for SIP trunks.

**Recommended Improvements**
- Multi-provider abstraction layer (Twilio + Exotel + Airtel IQ) with automatic failover and LCR.
- Mandatory DLT template registration and Truecaller/UCC business verification before any campaign goes live.
- SRTP + TLS-encrypted SIP trunks end-to-end.

### 1.2 STT (Speech-to-Text) Layer

**Strengths** — Cloud STT (Deepgram/Google/Azure) gives decent out-of-box Hindi/English accuracy.

**Weaknesses** — Single-vendor STT struggles with code-switched speech (Hinglish, Tanglish) and regional accents; no custom vocabulary/boosting for product/company names.

**Risks** — Misrecognition of key entities (phone numbers, dates, product names) breaks downstream intent detection and lead qualification.

**Scalability Issues** — Cloud STT vendors impose concurrent-stream quotas; without pre-negotiated enterprise limits, 10K concurrent calls will throttle.

**Cost Risks** — Per-minute STT billing ($0.004–$0.024/min) scales linearly with call volume; no caching/reuse strategy for repeated greeting/intro segments.

**Security Concerns** — Raw audio transiting to a third-party STT API without a data-processing agreement (DPA) raises DPDP/GDPR exposure for voice biometric-adjacent data.

**Recommended Improvements** — Multi-engine STT (Deepgram Nova-2/3 for English/Hinglish + AI4Bharat IndicWhisper or Sarvam STT for regional languages), domain-specific vocabulary boosting, DPA with every STT vendor, regional data residency where required.

### 1.3 TTS (Text-to-Speech) Layer

**Strengths** — Neural TTS voices (Azure/Google/ElevenLabs) sound natural for English/Hindi.

**Weaknesses** — Most global TTS vendors have weak or no support for Kannada, Telugu, Tamil, Malayalam, Marathi, Bengali, Gujarati, Punjabi at production quality; voice consistency across languages (same persona) is hard.

**Risks** — Inconsistent voice identity breaks brand trust; unnatural prosody in regional languages reduces conversion.

**Scalability Issues** — TTS synthesis latency (200–800ms) is often the single biggest contributor to perceived "robotic" pauses; non-streaming TTS APIs block the pipeline.

**Cost Risks** — Per-character billing models scale with verbosity; long LLM responses inflate TTS cost disproportionately.

**Security Concerns** — Cloned/branded voices need explicit consent management and usage-rights documentation (especially under emerging Indian voice-clone disclosure norms).

**Recommended Improvements** — Use Sarvam AI / AI4Bharat / Smallest.ai / ElevenLabs (multilingual model) with streaming synthesis (chunked sentence-level TTS), a single consistent custom voice trained across all 10 languages, hard caps on LLM response length to bound TTS cost.

### 1.4 LLM Layer

**Strengths** — A single hosted LLM (GPT-4o/Claude) gives strong reasoning and multilingual competence out of the box.

**Weaknesses** — No prompt-versioning, no guardrails layer, no RAG grounding mentioned — high hallucination risk on pricing/policy answers; using a frontier model for every turn is latency- and cost-inefficient.

**Risks** — Hallucinated pricing/legal claims during a sales call = direct business and compliance liability.

**Scalability Issues** — No request batching, caching, or model-tiering; every conversational turn pays full frontier-model latency and cost.

**Cost Risks** — At 100K calls/day × ~8 turns/call × ~500 tokens/turn, naive frontier-model use can cost $15K–$40K/day without tiering/caching.

**Security Concerns** — No prompt-injection defenses against adversarial callers; no output guardrails for restricted topics (legal/medical/financial advice, PII leakage).

**Recommended Improvements** — Tiered model routing (small fast model for intent/routing, frontier model only for complex objection handling), RAG-grounded responses, a guardrails layer (regex + classifier + LLM-judge) before TTS, prompt-injection detection, full prompt-version control with rollback.

### 1.5 CRM Layer

**Strengths** — Direct CRM webhook/API integration enables real-time lead sync.

**Weaknesses** — Point-to-point integrations (one connector per CRM) don't scale across tenants with different CRM configurations and custom fields.

**Risks** — Sync failures silently drop leads; no retry/dead-letter queue mentioned.

**Scalability Issues** — Rate limits on CRM APIs (Salesforce, HubSpot) under high call volume will throttle writes.

**Cost Risks** — API rate-limit overage fees on enterprise CRM tiers.

**Security Concerns** — OAuth tokens for customer CRMs need a proper secrets vault, not env vars.

**Recommended Improvements** — A CRM abstraction/sync service with per-tenant field mapping, async queue + retry + DLQ, OAuth token vaulting (e.g., HashiCorp Vault / AWS Secrets Manager).

### 1.6 Analytics Layer

**Strengths** — Basic call/conversion tracking exists.

**Weaknesses** — No real-time dashboards, no cohort/funnel analysis, no AI-quality metrics (hallucination rate, interruption rate, sentiment).

**Risks** — Enterprise customers will demand SLA-backed reporting; absence = lost deals.

**Scalability Issues** — Naive logging-to-DB writes don't scale past a few thousand calls/day without a proper event pipeline.

**Cost Risks** — Unbounded log retention inflates storage cost.

**Security Concerns** — Call transcripts/recordings in analytics stores need the same encryption/retention controls as the telephony layer.

**Recommended Improvements** — Event-streaming pipeline (Kafka/Kinesis) → warehouse (ClickHouse/BigQuery) → BI layer (Metabase/Looker), with tiered retention policies.

### 1.7 Security Layer

**Strengths** — AES-256/TLS 1.3 are claimed.

**Weaknesses** — No RBAC granularity, MFA, or SSO described in the baseline; no secrets management strategy; no audit log immutability guarantee.

**Risks** — Multi-tenant data leakage between customers is the single largest enterprise-trust risk.

**Recommended Improvements** — Full RBAC + SSO (SAML/OIDC) + MFA, tenant-isolated data stores (row-level security or per-tenant schema), immutable audit log (WORM storage), centralized secrets manager.

### 1.8 Infrastructure Layer

**Weaknesses** — Single-region deployment implied; no autoscaling, no multi-AZ failover, no DR/backup strategy documented.

**Risks** — Regional cloud outage = total platform downtime; no RTO/RPO targets defined.

**Recommended Improvements** — Multi-AZ Kubernetes deployment, horizontal autoscaling tied to concurrent-call metrics, documented RTO < 15 min / RPO < 5 min, active-passive multi-region for DR.

### 1.9 Compliance Layer

**Weaknesses** — DPDP/TRAI/DLT "alignment" is asserted but no concrete controls (consent capture, DND scrubbing, registered DLT templates, data localization) are described.

**Risks** — Calling DND-registered numbers without consent risk = regulatory penalties and carrier blacklisting of the calling entity.

**Recommended Improvements** — Mandatory DND/NDNC scrubbing before every campaign, consent-capture and storage with timestamped proof, DLT template + sender-ID registration per use case, data localization for voice/PII within India where required.

### 1.10 Knowledge Base Layer

**Weaknesses** — "Uses RAG" is asserted with no detail on chunking, embeddings, freshness, or hallucination controls.

**Recommended Improvements** — See Phase 6 for the full production RAG design.

---

# PHASE 2 — PRODUCTION ARCHITECTURE REDESIGN

### 2.1 Design Targets
- 10,000 concurrent calls, 100,000+ calls/day
- Multi-tenant SaaS (logical isolation per enterprise customer)
- High availability (99.95%+), multi-AZ, multi-region DR
- Low latency (sub-800ms voice round-trip)
- Fault tolerance: graceful degradation, not hard failure, on any single dependency outage

### 2.2 High-Level Architecture Diagram

```
                                ┌─────────────────────────┐
                                │   Customer Dashboard     │
                                │   Admin Dashboard         │
                                └───────────┬──────────────┘
                                            │ HTTPS/GraphQL
                                ┌───────────▼──────────────┐
                                │      API Gateway          │
                                │ (AuthN/Z, rate-limit,     │
                                │  multi-tenant routing)    │
                                └───────────┬──────────────┘
              ┌─────────────────────────────┼─────────────────────────────┐
              │                             │                             │
   ┌──────────▼─────────┐       ┌───────────▼───────────┐      ┌──────────▼─────────┐
   │  Campaign Manager   │       │   Call Orchestrator    │      │   CRM Sync Service  │
   │  (scheduling, lead   │──────▶  (call lifecycle FSM,  │◀─────│  (HubSpot/Zoho/SF/  │
   │   lists, pacing)     │       │   dialer integration)  │      │   Freshsales)       │
   └─────────────────────┘       └───────────┬───────────┘      └─────────────────────┘
                                              │
                                  ┌───────────▼───────────┐
                                  │   Telephony Gateway     │
                                  │ (multi-provider, SIP/   │
                                  │  PSTN, SRTP, LCR)       │
                                  └───────────┬───────────┘
                                              │ RTP audio stream
                                  ┌───────────▼───────────┐
                                  │     Session Manager     │
                                  │ (per-call state, media   │
                                  │  routing, recording)     │
                                  └───────────┬───────────┘
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
        │                                     │                                     │
┌───────▼────────┐   ┌───────────────┐  ┌─────▼──────┐   ┌────────────────┐  ┌──────▼───────┐
│      VAD        │──▶│  STT Service   │─▶│ Language    │──▶│ Intent          │─▶│ Conversation  │
│ (barge-in,      │   │ (streaming,    │  │ Router      │   │ Classification  │  │   Engine      │
│  endpointing)   │   │  multi-engine) │  │             │   │   Service        │  │  (LLM + state)│
└─────────────────┘   └───────────────┘  └─────────────┘   └────────────────┘  └──────┬───────┘
                                                                                        │
                          ┌─────────────────────────────────────────────────────────────┤
                          │                                                             │
              ┌───────────▼──────────┐   ┌────────────────────┐   ┌───────────────────▼───┐
              │ Prompt Management     │   │ Lead Qualification  │   │  Objection Handling     │
              │      System            │   │      Engine          │   │      Engine             │
              └───────────┬──────────┘   └─────────┬──────────┘   └───────────┬───────────┘
                          │                          │                          │
                          └──────────────┬───────────┴──────────────┬──────────┘
                                         │                            │
                              ┌──────────▼─────────┐      ┌───────────▼──────────┐
                              │   RAG Retrieval      │      │  Meeting Scheduler     │
                              │ (vector DB + rerank)  │      │  (calendar APIs)       │
                              └──────────┬─────────┘      └───────────┬──────────┘
                                         │                            │
                              ┌──────────▼─────────────────────────────▼──────────┐
                              │              Guardrails & Safety Layer              │
                              └──────────┬──────────────────────────────────────────┘
                                         │
                              ┌──────────▼─────────┐
                              │    TTS Service       │
                              │ (streaming, multi-   │
                              │  lingual voice)      │
                              └──────────┬─────────┘
                                         │ audio back to caller
                              ┌──────────▼─────────┐
                              │ Human Escalation     │
                              │     Service           │
                              └─────────────────────┘

   Cross-cutting: Notification Service · Analytics Service · Monitoring Service · Compliance Service
```

### 2.3 Service-by-Service Design

| Service | Responsibility | Tech Choice | Scaling Pattern |
|---|---|---|---|
| **API Gateway** | AuthN/Z, rate limiting, tenant routing, request validation | Kong / AWS API Gateway + Envoy | Stateless, horizontal autoscale on RPS |
| **Telephony Gateway** | SIP/PSTN connectivity, multi-provider LCR/failover, SRTP | Twilio + Exotel + Airtel IQ behind a custom abstraction (Kamailio/FreeSWITCH for SIP control) | Scale per-provider channel pools; circuit-breaker failover |
| **Call Orchestrator** | Call lifecycle finite-state-machine, retries, dialer pacing | Go/Node service on K8s, backed by Temporal.io workflows | Workflow-engine durability; horizontal pods per shard |
| **Session Manager** | Per-call ephemeral state, media routing, recording capture | Redis (session state) + media servers (FreeSWITCH/Jitsi media) | Sharded by call-ID hash; stateless app layer, sticky media routing |
| **Campaign Manager** | Lead list ingestion, dial pacing, DND/consent scrubbing, retry windows | Python/Go service + Postgres + Kafka producer | Partitioned by tenant + campaign |
| **Language Router** | Detect/route per-utterance language, manage code-switch state | Lightweight classifier service (see Phase 4) | Inline in pipeline, sub-50ms budget |
| **VAD** | Endpointing, barge-in detection | WebRTC VAD / Silero VAD on edge | Runs at media-server edge, near-zero added latency |
| **STT Service** | Streaming transcription, multi-engine routing by language | Deepgram (EN/HI) + Sarvam/AI4Bharat (regional) | Per-language connection pools, autoscaled by concurrent streams |
| **Intent Classification** | Turn-level intent (interested/objection/not-interested/question/booking) | Fine-tuned small transformer (DistilBERT-class) or fast LLM call | <100ms target, GPU-batch inference |
| **Conversation Engine** | Core dialogue management, LLM orchestration, state machine | Orchestration layer (LangGraph-style) + tiered LLMs | Stateless workers, horizontally scaled, model-tiered |
| **Prompt Management** | Versioned prompts, A/B tests, per-tenant customization | Git-backed prompt registry + feature-flag service | Cached in-memory per tenant |
| **Lead Qualification Engine** | BANT/MEDDIC-style scoring, entity extraction | Rules + ML scoring model | Stateless, low-latency |
| **Objection Handling Engine** | Pattern-matched + RAG-grounded rebuttals | RAG + prompt library | Shares RAG infra |
| **Meeting Scheduler** | Calendar availability, booking, confirmation | Google Calendar/Outlook API + internal slot engine | Idempotent booking with distributed lock |
| **Human Escalation Service** | Live transfer / callback queueing to human agents | SIP transfer + queue (Redis/SQS) | Scales with escalation-rate SLOs |
| **CRM Sync Service** | Bi-directional sync with HubSpot/Zoho/Salesforce/Freshsales | Async workers + per-tenant field mapping + DLQ | Queue-based, horizontally scaled consumers |
| **Analytics Service** | Call/business/AI-quality analytics pipeline | Kafka → ClickHouse → BI | Append-only, horizontally scaled stream processors |
| **Monitoring Service** | Infra + application health, alerting | Prometheus + Grafana + OpenTelemetry | See Phase 9 |
| **Compliance Service** | Consent ledger, DND scrubbing, DLT validation, retention enforcement | Dedicated microservice + immutable audit store | Tenant-isolated, write-heavy append store |
| **Notification Service** | SMS/email/Slack/webhook notifications | Event-driven (SNS/SQS or Kafka consumers) | Fan-out workers |
| **Admin Dashboard** | Platform ops: tenant management, billing, system health | React/Next.js SPA | CDN-served, stateless |
| **Customer Dashboard** | Campaign management, analytics, CRM config, transcripts | React/Next.js SPA | CDN-served, stateless |

### 2.4 Multi-Tenancy Model
- **Control plane:** shared (API Gateway, Orchestrator, dashboards) with tenant_id propagated end-to-end and enforced via row-level security (Postgres RLS) and per-tenant Kafka topic namespacing.
- **Data plane isolation:** Enterprise-tier tenants get dedicated Postgres schemas and dedicated vector-DB namespaces; lower tiers share pooled infrastructure with logical isolation.
- **Compute isolation:** Enterprise tenants can be pinned to dedicated node pools for predictable latency (noisy-neighbor mitigation).

### 2.5 High Availability & Fault Tolerance
- Active-active multi-AZ deployment in primary region (e.g., AWS ap-south-1 Mumbai); active-passive DR region (ap-south-2 Hyderabad).
- Every external dependency (telephony, STT, TTS, LLM) has a fallback provider and a circuit breaker; degrade gracefully (e.g., fallback to scripted TTS prompt) rather than drop the call.
- Call state checkpointed in Redis with replication; Session Manager crash triggers reattach from last checkpoint, not call drop.
- Target: RTO < 15 minutes, RPO < 5 minutes.

---

# PHASE 3 — REAL-TIME VOICE PIPELINE

### 3.1 Pipeline Flow
```
Customer Voice → VAD → STT (streaming) → Language Detection → Intent Detection
   → RAG Retrieval → LLM (Conversation Engine) → Guardrails → TTS (streaming) → Customer
```

### 3.2 Latency Budget (Target: ≤800ms, Ideal 300–500ms)

| Stage | Ideal | Max Acceptable | Optimization Technique |
|---|---|---|---|
| VAD / endpointing | 20–40ms | 80ms | Edge-deployed Silero/WebRTC VAD, adaptive silence threshold |
| STT (streaming, partial→final) | 80–150ms | 200ms | Streaming ASR with partial hypotheses, GPU-batched inference, regional model warm pools |
| Language detection | 10–20ms | 40ms | Run in parallel with STT finalization, lightweight classifier on partial transcript |
| Intent detection | 30–60ms | 100ms | Small distilled model, not full LLM; cached embeddings for common utterances |
| RAG retrieval | 30–60ms | 100ms | Pre-warmed vector index in memory (HNSW), top-k=5, async pre-fetch during STT finalization |
| LLM generation (first token) | 100–200ms | 250ms | Small/fast model for routine turns (e.g., Llama-3.1-8B fine-tuned or GPT-4o-mini); frontier model only on objection/complex turns; streaming token output |
| Guardrails check | 10–30ms | 50ms | Regex + lightweight classifier inline; full LLM-judge only sampled async, not blocking |
| TTS (first audio chunk) | 80–150ms | 180ms | Streaming/sentence-chunked synthesis, start playback on first phoneme chunk, not full utterance |
| Network/jitter buffer | 20–40ms | 60ms | Edge media servers co-located with telephony PoPs |
| **Total (ideal)** | **~380–650ms** | **≤800ms** | |

### 3.3 Optimization Techniques (Cross-Cutting)
1. **Streaming everywhere** — STT, LLM, and TTS all operate on partial/incremental data rather than waiting for complete utterances; this is the single biggest latency lever.
2. **Model tiering** — Use a fast small model for 80% of turns (greetings, simple Q&A, routing); escalate to a frontier model only for ambiguous objections or complex qualification logic.
3. **Speculative pre-fetch** — Start RAG retrieval and LLM context assembly as soon as partial STT transcript stabilizes, before the final transcript is confirmed.
4. **Sentence-level TTS chunking** — Synthesize and play audio per-sentence/clause rather than waiting for the full LLM response, overlapping generation and synthesis.
5. **Edge co-location** — Deploy media servers and STT/TTS inference in the same region/AZ as the telephony PoP (Mumbai) to eliminate cross-region RTT.
6. **Connection pooling & warm pools** — Keep GPU inference pools warm (no cold-start) for STT/TTS/small-LLM; use autoscaling with predictive pre-warming based on campaign schedules.
7. **Barge-in handling** — VAD-driven interruption lets the customer cut off the AI mid-sentence; cancel in-flight TTS immediately to avoid talking over the caller, reducing perceived latency to near-zero for the interrupting turn.
8. **Caching** — Cache RAG embeddings for FAQ-class questions and TTS audio for fixed phrases (greetings, compliance disclosures) to skip generation entirely.

---

# PHASE 4 — MULTILINGUAL AI DESIGN

### 4.1 Language Detection
- Run a lightweight language-ID model (e.g., fastText lid.176 fine-tuned on Indian-accented speech, or a dedicated audio-based LID model) on the first 1–2 seconds of each utterance, in parallel with STT.
- Confidence score attached to every detection; below threshold (e.g., <0.75) triggers fallback strategy (§4.6).

### 4.2 Accent Detection
- Secondary classifier trained on regional English accent markers (South Indian, North Indian, Bengali-English, etc.) to bias STT decoding and select the most accurate regional STT model variant.

### 4.3 Code-Switching (Hinglish, Tanglish, Kanglish)
- STT engines selected/tuned specifically for code-mixed decoding (AI4Bharat and Sarvam models are trained on code-switched Indian speech corpora).
- The Language Router operates at **utterance level, not call level** — each turn is independently classified, since speakers switch mid-conversation.
- The Conversation Engine prompt explicitly instructs the LLM to **mirror the customer's code-switch ratio** (e.g., respond in the same Hindi/English blend) rather than forcing pure Hindi or pure English.

### 4.4 Worked Examples

**Hindi-English:** Customer: *"Haan bhai, but what's the pricing for the enterprise plan?"* → LID detects HI+EN mix → Intent: pricing question → RAG retrieves pricing doc → LLM responds: *"Sure ji, enterprise plan ₹X/month se start hota hai, including..."* — matching the customer's mixed register.

**Kannada-English:** Customer: *"Illa illa, I'm not interested right now."* → Detected KN+EN, intent = objection/decline → Objection Handling Engine selects a soft-decline rebuttal in matching Kannada-English blend, or gracefully ends call if repeated.

**Tamil-English:** Customer: *"Sari, demo eppo book pannalam?"* → Detected TA+EN, intent = booking request → Meeting Scheduler invoked, confirmation delivered in Tamil-English blend.

### 4.5 Dynamic In-Call Language Switching
- Language state is tracked per-call as a rolling weighted average (not a single fixed value), updated after every turn.
- If the customer explicitly requests a switch ("Can we speak in Hindi?"), this is treated as a **hard override** with highest priority, immediately reconfiguring STT model, LLM prompt language instruction, and TTS voice/locale for all subsequent turns.
- TTS voice persona remains consistent (same trained multilingual voice model) across the switch to preserve brand identity.

### 4.6 Fallback Language Strategy
- If LID confidence is low or conflicting across two consecutive turns, the AI explicitly asks: *"Would you prefer I continue in Hindi or English?"* — converting ambiguity into a clarifying question rather than guessing.
- Default fallback order: detected language → campaign-configured default (often Hindi or English per region) → English.

### 4.7 Confidence Scoring & Routing
- Every pipeline stage (LID, STT, intent) emits a confidence score that's logged and feeds the Analytics Service; sustained low-confidence calls are flagged for human-escalation review and used to retrain/fine-tune models.

---

# PHASE 5 — AI SALES AGENT DESIGN

### 5.1 Architecture of the "Brain"

```
┌─────────────────────────────────────────────────────────────┐
│                     Conversation Engine                      │
│                                                                │
│  ┌───────────────┐   ┌───────────────┐   ┌─────────────────┐ │
│  │ Conversation   │   │  State Machine │   │ Entity Extractor│ │
│  │   Memory        │◀──▶│  (call phase) │◀──▶│  (NER pipeline) │ │
│  └───────────────┘   └───────────────┘   └─────────────────┘ │
│           │                   │                     │         │
│  ┌────────▼───────────────────▼─────────────────────▼───────┐ │
│  │              Lead Scoring & Qualification Logic            │ │
│  └────────┬───────────────────┬─────────────────────┬───────┘ │
│           │                   │                     │         │
│  ┌────────▼──────┐   ┌────────▼────────┐   ┌────────▼───────┐ │
│  │  Objection      │   │ Meeting Booking  │   │  Escalation    │ │
│  │  Handling       │   │     Module        │   │     Rules      │ │
│  └────────────────┘   └─────────────────┘   └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Conversation Memory
- **Short-term (working) memory:** full turn-by-turn transcript of the current call, held in-context for the LLM (windowed/summarized once it exceeds ~15 turns to control token cost).
- **Long-term memory:** persisted per-lead profile (prior call summaries, stated objections, preferences, BANT data) retrieved at the start of every new call to that lead — enabling continuity across follow-up calls.

### 5.3 State Machine (Call Phases)
```
GREETING → PERMISSION_TO_CONTINUE → DISCOVERY → QUALIFICATION
   → OBJECTION_HANDLING (loop) → PITCH/VALUE_PROP → BOOKING
   → CONFIRMATION → CLOSE
   (any phase) → ESCALATION → HUMAN_HANDOFF
   (any phase) → DECLINE → POLITE_CLOSE
```
Each phase has its own prompt template, allowed actions, and exit conditions — preventing the LLM from, say, attempting to book a meeting before qualification is complete.

### 5.4 Intent Detection
Turn-level intents: `interested`, `not_interested`, `objection_price`, `objection_timing`, `objection_trust`, `question_product`, `question_pricing`, `booking_request`, `request_human`, `request_callback`, `request_language_switch`, `silence/no_response`.

### 5.5 Entity Extraction
NER pulls: company name, role/title, team size, budget signals, timeline, preferred contact time, competitor mentions — written into the lead record in real time.

### 5.6 Lead Scoring
Composite score from: engagement signals (talk-time ratio, question-asking), BANT fields captured, objection count/severity, sentiment trend across the call. Score bands: **Hot (book immediately)**, **Warm (nurture/follow-up sequence)**, **Cold (deprioritize)**.

### 5.7 Qualification Logic (BANT-based)
Budget, Authority, Need, Timeline — each tracked as a slot-filling task; the Conversation Engine prioritizes unanswered slots in its next question, but never interrogates rigidly — slots are filled opportunistically from natural conversation.

### 5.8 Objection Handling Engine
Pattern: detect objection type → retrieve relevant rebuttal/case-study from RAG → generate a personalized, grounded response → re-attempt qualification or booking. Tracks objection recurrence — same objection raised twice without resolution triggers either a different rebuttal angle or graceful exit.

### 5.9 Meeting Booking
Real-time calendar-availability check → offer 2–3 concrete slots (not open-ended "when works for you") → confirm verbally → write to calendar + CRM → trigger SMS/email confirmation via Notification Service.

### 5.10 Escalation Rules & Human Handoff
Triggers: explicit request for a human, high-value lead (score above threshold) requesting complex negotiation, detected frustration/anger (sentiment threshold breach), repeated low-confidence STT/LID (can't understand caller), legal/compliance-sensitive question. Handoff mechanism: warm SIP transfer with a context summary pushed to the human agent's screen-pop before connection.

### 5.11 Sample End-to-End Workflow (Cold Call → Booked Demo)
1. Outbound dial via Telephony Gateway, consent/DND pre-check already passed at Campaign Manager.
2. GREETING phase: AI introduces itself and company, requests permission to continue.
3. DISCOVERY: open question about current process/pain point; entities extracted into lead record.
4. QUALIFICATION: BANT slots filled opportunistically.
5. Objection raised ("too expensive") → Objection Handling Engine retrieves ROI case study via RAG → personalized rebuttal.
6. Lead re-engages positively → lead score crosses "Hot" threshold.
7. BOOKING: AI offers 3 slots, customer picks one → Meeting Scheduler books calendar + CRM event.
8. CONFIRMATION: AI recaps next steps, sends SMS confirmation.
9. Call summary, transcript, lead score, and CRM updates pushed asynchronously to CRM Sync Service and Analytics Service.

---

# PHASE 6 — ENTERPRISE RAG ARCHITECTURE

### 6.1 Knowledge Sources
Company Profile · Product Information · Pricing · FAQs · Sales Scripts · Case Studies · Competitor Comparisons · Objection Handling Guides — each tagged with tenant_id, document type, version, and effective date.

### 6.2 Pipeline

```
Source Docs → Ingestion → Cleaning/Normalization → Chunking → Embedding
   → Vector DB (per-tenant namespace) → [Query time: Retrieval → Re-ranking
   → Prompt Assembly → LLM] → Guardrails/Hallucination Check → Response
```

**Data Ingestion:** Connectors for Google Drive/Notion/Confluence/CMS + manual upload (PDF/DOCX/CSV); scheduled re-sync (e.g., every 6 hours) plus webhook-triggered re-index on document update, to keep pricing/FAQ content fresh.

**Chunking:** Semantic chunking (not fixed-size) using sentence/paragraph boundaries with a 200–400 token target chunk size and 15% overlap; pricing tables and FAQs chunked at the Q&A-pair level rather than split mid-answer.

**Embeddings:** Multilingual embedding model (e.g., OpenAI text-embedding-3-large, or Cohere embed-multilingual-v3 / Voyage multilingual) so Hindi/Tamil/etc. queries retrieve correctly against English source docs and vice versa.

**Vector Search:** Pgvector (for simpler tenants) or a dedicated vector DB (Qdrant/Weaviate/Pinecone) with per-tenant namespace isolation, HNSW indexing, top-k=10 initial recall.

**Re-ranking:** Cross-encoder re-ranker (e.g., Cohere Rerank or a fine-tuned bge-reranker) narrows top-10 to top-3 most relevant chunks, correcting for embedding-similarity false positives.

**Prompt Assembly:** Top-3 chunks + conversation state + call-phase instructions assembled into a structured prompt with explicit citation markers, so the model is grounded and answer provenance is traceable for QA.

**Hallucination Prevention:**
- Grounding constraint in system prompt: "Only state pricing/policy facts present in the retrieved context; if not present, say you'll have a specialist follow up."
- Post-generation fact-check pass (lightweight LLM-judge or rule-based check) for high-risk categories (pricing, legal, compliance commitments) before TTS.
- Confidence-gated responses: if retrieval relevance score is below threshold, the AI defers ("Let me confirm that and follow up") rather than guessing.
- Continuous eval harness: sampled calls reviewed against a golden QA set to track hallucination rate as a tracked metric (see Phase 9).

### 6.3 Recommended Technologies

| Component | Recommendation |
|---|---|
| Embeddings | Cohere embed-multilingual-v3 or Voyage-multilingual (strong Indic language support) |
| Vector DB | Qdrant (self-hosted, cost-efficient at scale) or Pinecone (managed, less ops overhead) |
| Re-ranker | Cohere Rerank API or self-hosted bge-reranker-v2 |
| Orchestration | LangGraph / custom orchestration over LangChain primitives |
| Ingestion/ETL | Unstructured.io for document parsing, Airbyte for connector plumbing |

---

# PHASE 7 — CRM INTEGRATIONS

### 7.1 Supported CRMs
HubSpot · Zoho CRM · Salesforce · Freshsales

### 7.2 Capabilities Per CRM

| Capability | HubSpot | Zoho | Salesforce | Freshsales |
|---|---|---|---|---|
| Lead Creation | Contacts API | Leads API | Lead/Contact object | Leads API |
| Lead Updates | Properties API | Update Record API | SOQL/REST update | Update API |
| Meeting Scheduling | Meetings API | Calendar API | Event object via API | Appointments API |
| Activity Logging | Engagements API | Activities API | Task/Event object | Tasks API |
| Call Notes | Notes/Engagements | Notes API | Task description / Custom object | Notes API |
| Lead Scoring | Custom property write-back | Custom field write-back | Custom field / Einstein score override | Custom field write-back |

### 7.3 Integration Architecture
A single **CRM Sync Service** with a per-CRM adapter (Strategy pattern), a unified internal "CanonicalLead" schema, and a per-tenant field-mapping configuration (so each enterprise customer can map canonical fields to their custom CRM fields without code changes). All writes go through an async queue (Kafka/SQS) with idempotency keys, retry with exponential backoff, and a dead-letter queue with alerting for persistent failures.

### 7.4 Workflow Diagram (Generic)
```
Call Ends → Call Summary Generated → CanonicalLead Event Published to Queue
   → CRM Adapter (per tenant's configured CRM) Consumes Event
   → Field Mapping Applied → CRM API Call (Create/Update Lead, Log Activity,
     Create Meeting, Write Call Notes, Write Lead Score)
   → On Failure: Retry (3x backoff) → DLQ → Ops Alert
   → On Success: Ack + Analytics Event
```

---

# PHASE 8 — SECURITY & COMPLIANCE

### 8.1 Enterprise Security Controls

| Control | Implementation |
|---|---|
| RBAC | Role hierarchy (Owner/Admin/Manager/Agent/Viewer) enforced at API Gateway + service layer; per-tenant role customization for Enterprise tier |
| MFA | TOTP-based MFA mandatory for Admin roles; configurable for all roles |
| SSO | SAML 2.0 / OIDC support (Okta, Azure AD, Google Workspace) for Enterprise tier |
| Encryption | AES-256 at rest (DB, object storage, recordings); TLS 1.3 in transit; SRTP for media streams |
| Secrets Management | HashiCorp Vault / AWS Secrets Manager for all API keys, CRM OAuth tokens, telephony credentials — no secrets in env vars or code |
| Audit Logging | Immutable, append-only audit log (WORM-class storage) capturing every data access, config change, and call action with actor/timestamp |
| Data Retention | Tenant-configurable retention policy (default 90 days for recordings, 1 year for transcripts/analytics), automatic purge jobs |
| Call Recording Policies | Explicit verbal consent disclosure at call start (recorded as proof), opt-out honored immediately, recordings encrypted and access-logged |

### 8.2 Compliance Analysis

**DPDP Act (India, 2023):**
- Requires clear, specific consent before processing personal data, a documented purpose, and a Data Protection Officer for significant data fiduciaries.
- **Application:** Implement explicit consent capture before any outbound call/recording (logged with timestamp + consent text version), a published privacy notice, and a grievance-redressal contact. Recordings/transcripts count as personal data and must be deletable on a verified erasure request.

**TRAI Regulations:**
- Governs unsolicited commercial communication (UCC), requires registration of telemarketers and use of approved headers/templates.
- **Application:** Register Involynk (and each enterprise tenant, as applicable) as a Principal Entity / Telemarketer on DLT, use only approved sender IDs/templates for any SMS confirmations, and respect NDNC (Do Not Disturb) registry — scrub lead lists against NDNC before any cold-call campaign unless prior consent/relationship exists.

**DLT (Distributed Ledger-based registration for telemarketing):**
- All transactional/promotional SMS triggered by the platform (booking confirmations, follow-ups) must use DLT-registered templates and headers; voice calls from unregistered numbers are increasingly flagged/blocked under TRAI's AI-based UCC detection (effective 2024 onward).
- **Application:** Maintain a DLT compliance module that validates every SMS template pre-send and blocks sends with unregistered templates; maintain registered CLI number pools per tenant use case.

**GDPR (for any EU-resident data subjects, e.g., enterprise customers with EU operations):**
- Right to erasure, right to access, data minimization, lawful basis for processing, and cross-border transfer restrictions.
- **Application:** Data residency controls (EU customer data not required to leave EU region if mandated), DPA templates with all sub-processors (STT/TTS/LLM vendors), and a self-service data export/erasure flow in the Customer Dashboard.

---

# PHASE 9 — OBSERVABILITY

### 9.1 Architecture
```
Application/Infra → OpenTelemetry SDK (traces, metrics, logs)
   → OTel Collector → [Prometheus (metrics) | Loki (logs) | Tempo/Jaeger (traces)]
   → Grafana (unified dashboards) + Alertmanager (paging)
Call/Business Events → Kafka → ClickHouse → BI layer (Metabase/Looker)
```

### 9.2 Signal Categories

| Category | Examples |
|---|---|
| Metrics | Concurrent calls, calls/sec, per-stage latency (p50/p95/p99), error rates, STT/LLM/TTS provider latency & error rate, queue depth |
| Logs | Structured per-call logs, service logs, audit logs |
| Distributed Tracing | Full per-call trace across VAD→STT→LLM→TTS spans, cross-service trace propagation via OpenTelemetry |
| Call Analytics | Talk-time ratio, interruption count, hold time, call outcome, language used, escalation rate |
| AI Analytics | Hallucination rate (sampled eval), intent-classification accuracy, RAG retrieval relevance, objection-resolution rate |
| Business Analytics | Lead conversion rate, meetings booked/day, cost-per-qualified-lead, campaign ROI |
| Infrastructure | Node/pod health, autoscaling events, DB replication lag, queue backlog |

### 9.3 Dashboards

- **Executive Dashboard:** calls/day, conversion rate, meetings booked, revenue attributed, cost-per-call trend, SLA compliance.
- **Operational Dashboard:** live concurrent-call count, p95 latency per pipeline stage, error rates by provider, escalation queue depth, on-call alerts.

---

# PHASE 10 — COST MODEL

Assumptions: average call length 3 minutes; LLM mix 80% small/fast model, 20% frontier model; multilingual STT/TTS blended rate; India-hosted infra (AWS ap-south-1) at standard list pricing, before negotiated enterprise discounts.

| Volume Tier | Telephony | STT | LLM | TTS | Infra (compute/DB/network) | Storage | Monitoring | **Total/day** | **Cost/call** |
|---|---|---|---|---|---|---|---|---|---|
| 100 calls/day | ₹1,500 | ₹150 | ₹400 | ₹250 | ₹800 (shared baseline) | ₹50 | ₹100 | **~₹3,250** | **~₹32.5** |
| 1,000 calls/day | ₹15,000 | ₹1,500 | ₹4,000 | ₹2,500 | ₹3,500 | ₹400 | ₹300 | **~₹27,200** | **~₹27.2** |
| 10,000 calls/day | ₹1,50,000 | ₹15,000 | ₹35,000 | ₹22,000 | ₹18,000 | ₹3,000 | ₹1,500 | **~₹2,44,500** | **~₹24.5** |
| 100,000 calls/day | ₹13,50,000 | ₹1,20,000 | ₹2,60,000 | ₹1,70,000 | ₹95,000 | ₹18,000 | ₹6,000 | **~₹20,19,000** | **~₹20.2** |

*Unit cost declines with scale due to fixed infra/monitoring amortization and volume-tiered vendor pricing; telephony remains the largest line item throughout, reinforcing the need for least-cost routing across multiple providers.*

### 10.1 Cost Optimization Strategies
1. **LCR across telephony providers** — route each call to whichever provider offers the lowest per-minute rate for that destination/circle at that moment.
2. **Model tiering** — reserve frontier LLMs for genuinely complex turns (~15–20% of turns); this alone can cut LLM spend by 60–70% versus an all-frontier baseline.
3. **TTS caching** — cache and reuse audio for fixed/compliance phrases and common FAQ answers instead of re-synthesizing every time.
4. **STT/TTS volume commitments** — negotiate committed-use discounts once volume is predictable (typically 20–40% off list at 10K+ calls/day).
5. **Tiered storage** — move recordings older than 30 days to cold/archival storage (e.g., S3 Glacier) per retention policy.
6. **Autoscaling with predictive pre-warming** — scale compute to campaign schedules rather than running peak capacity 24/7.
7. **Spot/preemptible instances** for non-real-time batch workloads (analytics ETL, model fine-tuning).

---

# PHASE 11 — PRODUCT STRATEGY / SAAS PRICING

| Plan | Calls Included | Languages | CRM Integrations | Analytics | Support | SLA |
|---|---|---|---|---|---|---|
| **Starter** | 1,000 calls/month | English + Hindi | 1 CRM (HubSpot or Zoho) | Basic dashboard (calls, outcomes) | Email support, 48hr response | 99.0% uptime |
| **Growth** | 10,000 calls/month | English + Hindi + 3 regional languages | 2 CRMs | Standard analytics (funnel, lead scoring, cohort) | Email + chat, 24hr response | 99.5% uptime |
| **Business** | 50,000 calls/month | All 10 languages | All 4 CRMs + webhook/API access | Advanced analytics + AI-quality metrics (hallucination/escalation rate) | Priority support, 8hr response, dedicated CSM | 99.9% uptime |
| **Enterprise** | Custom / 100,000+ calls/month | All 10 languages + custom voice/persona | All CRMs + custom integrations | Full BI access, custom dashboards, data export, SSO-gated reporting | 24×7 dedicated support, named TAM | 99.95% uptime, custom DR/RTO terms |

**Add-ons across all tiers:** dedicated phone number pools, custom voice cloning (with consent management), white-label dashboard branding (Business+), on-premise/VPC deployment (Enterprise only).

---

# APPENDIX — TECHNOLOGY STACK SUMMARY

| Layer | Primary | Secondary/Fallback |
|---|---|---|
| Telephony | Twilio | Exotel, Airtel IQ |
| STT | Deepgram (EN/HI) | Sarvam AI / AI4Bharat (regional) |
| TTS | Sarvam AI / Smallest.ai (multilingual) | ElevenLabs, Azure TTS |
| LLM (fast tier) | GPT-4o-mini / Llama-3.1-8B fine-tuned | — |
| LLM (frontier tier) | Claude / GPT-4o | — |
| Vector DB | Qdrant | Pinecone |
| Embeddings | Cohere embed-multilingual-v3 | Voyage multilingual |
| Orchestration | Temporal.io (call workflows), LangGraph (conversation) | — |
| Messaging/Queue | Kafka | AWS SQS/SNS |
| Observability | Prometheus + Grafana + OpenTelemetry + Loki + Tempo | — |
| Analytics Warehouse | ClickHouse | BigQuery |
| Secrets | HashiCorp Vault | AWS Secrets Manager |
| Infra | Kubernetes on AWS (ap-south-1 primary, ap-south-2 DR) | — |

---

*End of document. This blueprint is intended as a living architecture reference — revisit cost assumptions quarterly against actual vendor invoices, and revisit the compliance section whenever DPDP Rules or TRAI UCC regulations are amended.*
