import fetch from "node-fetch";
import type { CallState, CanonicalLead } from "@involynk/shared";

const CRM_SYNC_URL = process.env.CRM_SYNC_URL ?? "http://localhost:8081";

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
}
