# Involynk AI Calling Platform — MVP

A working, runnable skeleton of the platform described in
[INVOLYNK_AI_CALLING_PLATFORM_ARCHITECTURE.md](INVOLYNK_AI_CALLING_PLATFORM_ARCHITECTURE.md).

It places a real outbound phone call via Twilio and bridges the call audio
directly to Deepgram's **Voice Agent API** — a single real-time session that
handles speech-to-text (Deepgram Flux), the conversation itself (Google
Gemini, prompted as an Involynk AI SDR), and text-to-speech (Deepgram Aura-2)
in one loop. A lightweight local heuristic tracks call phase/entities/lead
score from the live transcript and syncs the lead + call summary to HubSpot
when the call ends.

This is **one English/Hindi-capable end-to-end vertical slice** of the full
enterprise architecture — not the multi-tenant, 10K-concurrent-call production
system described in the architecture doc. Treat it as the seed to build that
system out from.

## Services

| Service | Port | Purpose |
|---|---|---|
| `api-gateway` | 3000 | Twilio TwiML webhook, returns `<Connect><Stream>` pointing at voice-pipeline |
| `voice-pipeline` | 8080 | WebSocket bridge between Twilio Media Streams and the Deepgram Voice Agent session |
| `call-orchestrator` | 4000 | REST endpoint to place outbound calls via Twilio |
| `crm-sync` | 8081 | Receives call-end events, upserts lead + call note into HubSpot |

## Prerequisites

- Node.js >= 18.18
- A [Twilio](https://www.twilio.com/try-twilio) account + phone number with Voice capability
- A [Deepgram](https://deepgram.com) API key (used for the Voice Agent's listen + speak providers)
- A [Google AI Studio](https://aistudio.google.com/apikey) API key (used as the Agent's "think" provider — Vertex AI/Workspace keys will NOT work here)
- A [HubSpot](https://developers.hubspot.com) private app access token (scopes: `crm.objects.contacts.write`, `crm.objects.contacts.read`)
- [ngrok](https://ngrok.com) (or similar) to expose `api-gateway` and `voice-pipeline` publicly, since Twilio needs to reach them over the internet

## Setup

```bash
npm install
cp .env.example .env
# fill in all API keys/tokens in .env
```

### 1. Expose your local services with ngrok

```bash
ngrok http 3000   # for api-gateway -> note the https URL
ngrok http 8080   # for voice-pipeline -> note the wss URL (use wss:// not https://)
```

Update `.env`:
```
API_GATEWAY_PUBLIC_URL=https://<api-gateway-ngrok-domain>
VOICE_PIPELINE_WS_URL=wss://<voice-pipeline-ngrok-domain>/media-stream
```

### 2. Run all services (in separate terminals)

```bash
npm run dev:api-gateway
npm run dev:voice-pipeline
npm run dev:call-orchestrator
npm run dev:crm-sync
```

Or via Docker Compose (after filling `.env`):

```bash
docker compose up --build
```

### 3. Place a test outbound call

```bash
curl -X POST http://localhost:4000/calls/outbound \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "demo", "leadPhoneNumber": "+91XXXXXXXXXX"}'
```

Your phone should ring; answer it and talk to the AI SDR. When the call ends
(decline, escalation, or reaching the CLOSE phase), `crm-sync` will upsert a
HubSpot contact and log a call note with the full transcript and lead score.

## What's implemented vs. stubbed

**Implemented (real, working):**
- Real outbound PSTN call via Twilio
- Real-time bidirectional audio over Twilio Media Streams (WebSocket), bridged directly to/from Deepgram's Voice Agent session at mulaw/8kHz (no transcoding)
- Deepgram Voice Agent API session: Flux STT (`listen`) + Gemini (`think`, via custom endpoint) + Aura-2 TTS (`speak`), all in one real-time loop
- Local heuristic call-phase tracking (`GREETING → DISCOVERY → QUALIFICATION → OBJECTION_HANDLING → PITCH → BOOKING → CONFIRMATION → CLOSE`, plus `ESCALATION`/`DECLINED`) derived from the live `ConversationText` transcript, for CRM/scoring purposes
- Barge-in handling (`UserStartedSpeaking` clears in-flight audio on the Twilio stream)
- Simple entity extraction (company, team size, timeline, budget signal) and rule-based lead scoring
- HubSpot upsert (create-or-update contact by phone) + call note logging
- Retry-with-backoff and an in-memory dead-letter queue in `crm-sync`

**Stubbed / not yet built (see architecture doc for the full design):**
- Multi-tenant data isolation, RBAC/SSO/MFA, audit logging
- RAG knowledge base (pricing/FAQ grounding) — the Agent's system prompt has no retrieval step
- Multilingual language detection/routing beyond Deepgram Flux's built-in language handling
- Campaign Manager (lead lists, DND/consent scrubbing, pacing)
- Meeting Scheduler (calendar integration) — `BOOKING` phase doesn't yet write to a calendar
- Human escalation transfer (currently just announces escalation and hangs up)
- Analytics/observability pipeline (Prometheus/Grafana/OpenTelemetry, ClickHouse)
- Zoho/Salesforce/Freshsales CRM adapters
- Admin/Customer dashboards

## Repo layout

```
apps/
  api-gateway/       Express service: Twilio TwiML webhook
  voice-pipeline/     WebSocket service: Twilio <-> Deepgram Voice Agent bridge
  call-orchestrator/  Express service: places outbound Twilio calls
  crm-sync/            Express service: HubSpot lead/call sync
packages/
  shared/              Shared TypeScript types (CallState, CanonicalLead, etc.)
INVOLYNK_AI_CALLING_PLATFORM_ARCHITECTURE.md   Full enterprise architecture & strategy doc
```
