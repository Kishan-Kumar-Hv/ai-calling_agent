import type { CallState, CallPhase, LeadScoreBand } from "@involynk/shared";

// The Deepgram Agent's Gemini "think" model drives the actual conversation;
// this heuristic just tracks where the call likely is for CRM/scoring purposes.
export function nextPhase(current: CallPhase, customerText: string): CallPhase {
  const lower = customerText.toLowerCase();
  if (/not interested|no thanks|stop calling/.test(lower)) return "DECLINED";
  if (/human|agent|representative|manager/.test(lower)) return "ESCALATION";
  if (current === "GREETING") return "DISCOVERY";
  if (current === "DISCOVERY") return "QUALIFICATION";
  if (current === "QUALIFICATION" && /expensive|cost|budget|busy|think about it/.test(lower)) {
    return "OBJECTION_HANDLING";
  }
  if (current === "QUALIFICATION") return "PITCH";
  if (current === "OBJECTION_HANDLING") return "PITCH";
  if (current === "PITCH" && /sure|okay|yes|book|schedule/.test(lower)) return "BOOKING";
  if (current === "BOOKING") return "CONFIRMATION";
  if (current === "CONFIRMATION") return "CLOSE";
  return current;
}

export function extractEntities(state: CallState, customerText: string): void {
  const companyMatch = customerText.match(/(?:we are|company is|i'm from|i work at)\s+([A-Za-z0-9& ]{2,40})/i);
  if (companyMatch) state.entities.companyName = companyMatch[1].trim();

  const teamSizeMatch = customerText.match(/(\d{1,4})\s*(?:people|employees|agents|reps)/i);
  if (teamSizeMatch) state.entities.teamSize = teamSizeMatch[1];

  const timelineMatch = customerText.match(/(this month|next month|this quarter|next quarter|this week|asap|in \d+ (?:weeks|months))/i);
  if (timelineMatch) state.entities.timeline = timelineMatch[1];

  if (/expensive|cost|budget|pricing/i.test(customerText)) {
    state.entities.budgetSignal = "price-sensitive";
  }
}

export function scoreLead(state: CallState): LeadScoreBand {
  let score = 0;
  if (state.entities.companyName) score += 1;
  if (state.entities.teamSize) score += 1;
  if (state.entities.timeline) score += 2;
  if (state.phase === "BOOKING" || state.phase === "CONFIRMATION" || state.phase === "CLOSE") score += 3;
  score -= state.objectionCount;

  if (score >= 4) return "HOT";
  if (score >= 2) return "WARM";
  if (score > 0) return "COLD";
  return "UNSCORED";
}
