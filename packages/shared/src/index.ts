export type CallPhase =
  | "GREETING"
  | "DISCOVERY"
  | "QUALIFICATION"
  | "OBJECTION_HANDLING"
  | "PITCH"
  | "BOOKING"
  | "CONFIRMATION"
  | "CLOSE"
  | "ESCALATION"
  | "DECLINED";

export type LeadScoreBand = "HOT" | "WARM" | "COLD" | "UNSCORED";

export interface LeadEntities {
  companyName?: string;
  role?: string;
  teamSize?: string;
  budgetSignal?: string;
  timeline?: string;
  preferredContactTime?: string;
  competitorMentions?: string[];
  // Bakery & Retail 5-Stage Order Entities
  orderItem?: string;
  quantity?: string;
  eventOccasion?: string;
  deliveryDate?: string;
  deliveryLocation?: string;
}

export interface CallTurn {
  speaker: "agent" | "customer";
  text: string;
  language?: string;
  timestamp: number;
}

export interface CallState {
  callSid: string;
  tenantId: string;
  leadPhoneNumber: string;
  phase: CallPhase;
  transcript: CallTurn[];
  entities: LeadEntities;
  scoreBand: LeadScoreBand;
  objectionCount: number;
  detectedLanguage: string;
  startedAt: number;
}

export interface CanonicalLead {
  tenantId: string;
  phoneNumber: string;
  companyName?: string;
  role?: string;
  scoreBand: LeadScoreBand;
  callSummary: string;
  callOutcome: "booked" | "follow_up" | "not_interested" | "escalated";
  meetingTime?: string;
  callSid: string;
}

export function createInitialCallState(params: {
  callSid: string;
  tenantId: string;
  leadPhoneNumber: string;
}): CallState {
  return {
    callSid: params.callSid,
    tenantId: params.tenantId,
    leadPhoneNumber: params.leadPhoneNumber,
    phase: "GREETING",
    transcript: [],
    entities: {},
    scoreBand: "UNSCORED",
    objectionCount: 0,
    detectedLanguage: "en",
    startedAt: Date.now(),
  };
}
