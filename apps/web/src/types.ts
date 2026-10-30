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

export type CallPriority = "P0" | "P1" | "P2";

export interface Shop {
  id: string;
  name: string;
  category: "Retail" | "Dry Fruits & Spices" | "Bakery & Cafe" | "Healthcare Clinic" | "Jewelry" | "Real Estate" | "Salon & Spa";
  phone: string;
  address: string;
  operatingHours: string;
  observedGaps: string[];
  bannerImage: string;
  aiSettings: {
    personaName: string;
    language: "en-IN" | "hi-IN" | "kn-IN" | "hinglish";
    tone: "Friendly & Empathetic" | "Urgent & Direct" | "Executive & Polished";
    autoWhatsApp: boolean;
    whatsappTemplate: string;
    transferNumber: string;
    maxRetries: number;
    callPacingSeconds: number;
  };
  twilioConfig?: {
    phoneNumber?: string;
    accountSid?: string;
    authToken?: string;
    enabled?: boolean;
  };
  metrics: {
    totalMissedRecovered: number;
    conversionRate: number;
    revenueSaved: string;
    avgLatencyMs: number;
  };
}

export interface MissedCall {
  id: string;
  shopId: string;
  shopName: string;
  phoneNumber: string;
  callerName: string;
  timestamp: string;
  priority: CallPriority;
  status: "pending" | "dialing" | "completed" | "failed" | "cooldown_blocked";
  lastCallAttempt?: string;
  cooldownUntil?: string;
  duration?: string;
  outcome?: "booked" | "follow_up" | "not_interested" | "escalated";
  scoreBand?: LeadScoreBand;
  callNotes?: string;
  actionItems?: string[];
  callCount?: number;
  priorityReason?: string;
  priorityScore?: number;
  queueRank?: number;
  whatsAppAckSent?: boolean;
  tieBreakWinner?: boolean;
}

export interface CallTranscriptTurn {
  id: string;
  speaker: "agent" | "customer";
  text: string;
  timestamp: string;
  entities?: string[];
  sentiment?: "positive" | "neutral" | "skeptical" | "interested" | "curious";
}

export interface LiveCallSession {
  callSid: string;
  shopId: string;
  shopName: string;
  leadName: string;
  leadPhoneNumber: string;
  activeSpeaker: "agent" | "customer" | "silent";
  phase: CallPhase;
  sentiment: "skeptical" | "curious" | "interested" | "delighted" | "neutral";
  scoreBand: LeadScoreBand;
  durationSec: number;
  transcript: CallTranscriptTurn[];
  whatsAppPushed: boolean;
  whatsAppOpened: boolean;
  supervisorListening: boolean;
  whisperMessage?: string;
  extractedEntities: {
    companyName?: string;
    teamSize?: string;
    budgetSignal?: string;
    timeline?: string;
    intent?: string;
  };
  callNotes?: string;
  actionItems?: string[];
  objectionsRaised?: string[];
  twilioMode?: "browser_voice" | "twilio_pstn";
  twilioDetails?: {
    outboundNumber?: string;
    fromNumber?: string;
    status?: string;
    recordingUrl?: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  avatar: string;
  role?: "business_owner" | "super_admin";
}

export interface AdminTalk {
  id: string;
  _id?: string;
  ownerId?: string;
  shopId?: string;
  shopName: string;
  ownerName: string;
  callSid: string;
  leadName: string;
  leadPhoneNumber: string;
  phase: string;
  sentiment: string;
  scoreBand: string;
  durationSec: number;
  callOutcome: "booked" | "follow_up" | "not_interested" | "escalated";
  whatsAppPushed: boolean;
  whatsAppOpened: boolean;
  transcript: Array<{
    speaker: "agent" | "customer";
    text: string;
    timestamp: string;
    entities?: string[];
  }>;
  extractedEntities: {
    companyName?: string;
    teamSize?: string;
    budgetSignal?: string;
    timeline?: string;
    intent?: string;
  };
  callNotes?: string;
  actionItems?: string[];
  objectionsRaised?: string[];
  twilioDetails?: {
    outboundNumber?: string;
    fromNumber?: string;
    status?: string;
    recordingUrl?: string;
  };
  createdAt: string;
}

export interface AdminStats {
  totalCalls: number;
  totalStores: number;
  totalUsers: number;
  overallConversionRate: number;
  totalRevenueBooked: string;
  avgConversationalLatency: string;
  traiComplianceScore: string;
}
