import fetch from "node-fetch";
import type { CallState, CanonicalLead } from "@involynk/shared";

const CRM_SYNC_URL = process.env.CRM_SYNC_URL ?? "http://localhost:8081";
const CALL_ORCHESTRATOR_URL = process.env.CALL_ORCHESTRATOR_URL ?? "http://localhost:4000";

export function reportCallEnded(state: CallState, outcome: CanonicalLead["callOutcome"]): void {
  const lead: CanonicalLead = {
    tenantId: state.tenantId,
    phoneNumber: state.leadPhoneNumber,
    companyName: state.entities.companyName,
    role: state.entities.role,
    scoreBand: state.scoreBand,
    callSummary: state.transcript.map((t) => `${t.speaker}: ${t.text}`).join("\n"),
    callOutcome: outcome,
    callSid: state.callSid,
  };

  fetch(`${CRM_SYNC_URL}/leads/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  }).catch((err) => console.error("[crmClient] failed to report call end", err));

  // Persist into MongoDB Atlas CallRecord collection
  fetch(`${CALL_ORCHESTRATOR_URL}/api/voice/record`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shopId: state.tenantId,
      callSid: state.callSid,
      leadName: state.entities.companyName || "Phone Customer",
      leadPhoneNumber: state.leadPhoneNumber,
      phase: state.phase,
      sentiment: state.scoreBand === "HOT" ? "interested" : "neutral",
      scoreBand: state.scoreBand,
      durationSec: Math.max(30, state.transcript.length * 12),
      callOutcome: outcome,
      transcript: state.transcript.map((t) => ({
        speaker: t.speaker,
        text: t.text,
        timestamp: new Date(t.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      })),
      extractedEntities: {
        companyName: state.entities.companyName,
        intent: "Twilio Outbound/Inbound Telephony Call",
      },
      whatsAppPushed: state.phase === "CLOSE",
      twilioDetails: {
        fromNumber: process.env.TWILIO_FROM_NUMBER || "",
        status: outcome,
      },
    }),
  }).catch((err) => console.error("[crmClient] failed to persist to MongoDB Atlas", err));
}
