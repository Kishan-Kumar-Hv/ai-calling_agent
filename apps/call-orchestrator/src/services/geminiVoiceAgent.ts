export interface CatalogProduct {
  id: string;
  name: string;
  description?: string;
  category?: string;
  priceRetail: number;
  priceWholesale?: number;
  unit?: string;
  minOrderQty?: number;
  maxOrderQty?: number;
  stockStatus?: "in_stock" | "limited" | "out_of_stock";
  tags?: string[];
}

export interface VoiceTurnRequest {
  storeContext: {
    name: string;
    category?: string;
    personaName?: string;
    phone?: string;
    observedGaps?: string[];
  };
  catalog?: CatalogProduct[];   // ← live product catalog injected from DB
  callerName?: string;
  customerSpeech: string;
  conversationHistory: Array<{
    speaker: "agent" | "customer";
    text: string;
    timestamp?: string;
  }>;
  currentPhase?: string;
}

export interface VoiceTurnResponse {
  agentResponse: string;
  detectedPhase: "GREETING" | "DISCOVERY" | "QUALIFICATION" | "OBJECTION_HANDLING" | "PITCH" | "BOOKING" | "CONFIRMATION" | "CLOSE" | "ESCALATION" | "DECLINED";
  sentiment: "interested" | "curious" | "skeptical" | "positive" | "neutral";
  scoreBand: "HOT" | "WARM" | "COLD";
  extractedEntities: {
    companyName?: string;
    teamSize?: string;
    budgetSignal?: string;
    timeline?: string;
    intent?: string;
  };
  keyEntityTags: string[];
  callNotes?: string;
  actionItems?: string[];
  objectionsRaised?: string[];
  whatsAppPushed: boolean;
  isTerminal: boolean;
  outcome?: "booked" | "follow_up" | "not_interested" | "escalated";
}

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY || "";
const GEMINI_MODEL = "gemini-3.5-flash-lite";

export async function processVoiceTurn(req: VoiceTurnRequest): Promise<VoiceTurnResponse> {
  const store = req.storeContext;
  const persona = store.personaName || "Riya";
  const storeName = store.name || "Involynk Retail";
  const category = store.category || "Retail Store";
  const gaps = store.observedGaps?.join(", ") || "capturing local walk-in customers";

  // ── Build live catalog section for Gemini prompt ──────────────────────────
  let catalogSection = "";
  if (req.catalog && req.catalog.length > 0) {
    const lines = req.catalog.map((p) => {
      const wholesale = p.priceWholesale ? ` | Wholesale: ₹${p.priceWholesale}/${p.unit || "pc"}` : "";
      const stock = p.stockStatus === "out_of_stock" ? " [OUT OF STOCK]" : p.stockStatus === "limited" ? " [LIMITED STOCK]" : "";
      const minQty = p.minOrderQty && p.minOrderQty > 1 ? ` | Min order: ${p.minOrderQty} ${p.unit || "pc"}` : "";
      const tags = p.tags && p.tags.length > 0 ? ` | Tags: ${p.tags.join(", ")}` : "";
      return `  - ${p.name}${stock}: ₹${p.priceRetail}/${p.unit || "pc"}${wholesale}${minQty}${tags}${p.description ? ` — ${p.description}` : ""}`;
    });
    catalogSection = `\n\nSHOP LIVE PRODUCT CATALOG (quote ONLY these real products and prices — never invent items):\n${lines.join("\n")}\n\nWhen a customer asks what is available, list relevant items from the catalog above with actual prices. If they ask for bulk/wholesale, give the priceWholesale figure if available. If an item is OUT OF STOCK, politely say so and suggest the nearest alternative from the catalog.`;
  }

  const systemInstructions = `You are ${persona}, an elite, professional, and empathetic AI Voice Sales Representative calling from "${storeName}" (${category}).
You are on an active phone call with a customer.
CRITICAL LANGUAGE REQUIREMENT: You MUST speak in fluent, natural, professional ENGLISH ONLY. DO NOT use Hindi or Hinglish phrases. Keep your tone polite, warm, and clear.

CRITICAL ASR / SPEECH RECOGNITION RESILIENCE:
1. The customer speech input arrives from real-time Speech-to-Text (ASR) which may contain minor phonetic mis-hearings.
   Automatically resolve intended meanings:
   - "campers" / "cameras" / "pamper" -> gift "hampers"
   - "kaju" -> cashews
   - "badam" -> almonds
   - "pista" -> pistachios
2. Always respond naturally and smoothly to what the customer intended. Never mention microphone or transcription errors.

Your store objective:
1. Understand the customer's request (e.g. bulk gift orders, pricing inquiries, product availability, delivery scheduling).
2. Answer their question concisely in 1 to 2 spoken English sentences (max 35 words). This is a fast, natural phone conversation.
3. Extract key buying signals: what product they need, quantity, budget, timeline, and urgency.
4. ALWAYS REFER TO THE LIVE PRODUCT CATALOG BELOW when answering product and pricing questions — quote verified prices only.
5. If the customer asks what is available, mention 2–3 top items from the catalog with exact prices.
6. Offer to send our complete catalog, formal quote, or booking confirmation directly to their WhatsApp.
7. If the customer agrees (e.g., "yes please", "send it", "sure", "confirm it"), confirm the WhatsApp dispatch clearly in English and politely conclude.
8. If the customer asks for a human manager or sounds frustrated, politely confirm you will transfer them to the store manager.

Return ONLY a valid JSON object with the following schema:
{
  "agentResponse": "Concise spoken English answer (1-2 sentences in pure English)",
  "detectedPhase": "GREETING" | "DISCOVERY" | "QUALIFICATION" | "OBJECTION_HANDLING" | "PITCH" | "BOOKING" | "CONFIRMATION" | "CLOSE" | "ESCALATION" | "DECLINED",
  "sentiment": "interested" | "curious" | "skeptical" | "positive" | "neutral",
  "scoreBand": "HOT" | "WARM" | "COLD",
  "extractedEntities": {
    "companyName": "detected business/client name or null",
    "teamSize": "detected quantity, guest count, or items, or null",
    "budgetSignal": "detected budget e.g. Bulk Wholesale, Flexible, ₹20k, or null",
    "timeline": "detected time frame e.g. Diwali, Today 5pm, Sunday, or null",
    "intent": "summary of customer purpose"
  },
  "keyEntityTags": ["list", "of", "detected", "keywords"],
  "callNotes": "Clear running notes summarizing customer requirements, agreements, and current stance",
  "actionItems": ["Immediate follow-up task 1", "task 2"],
  "objectionsRaised": ["any customer hesitation, price objection, or delivery concern, or empty"],
  "whatsAppPushed": true or false,
  "isTerminal": true or false,
  "outcome": "booked" | "follow_up" | "not_interested" | "escalated"
}`;

  const conversationContext = req.conversationHistory
    .map((turn) => `${turn.speaker === "agent" ? persona : "Customer"}: "${turn.text}"`)
    .join("\n");

  const prompt = `${systemInstructions}${catalogSection}

Current Store: ${storeName}
Category: ${category}
Known Gap/Context: ${gaps}
Current Call Phase: ${req.currentPhase || "DISCOVERY"}

Conversation So Far:
${conversationContext || "(Call just started)"}

Customer Just Said:
"${req.customerSpeech}"

Generate the JSON analysis and spoken response now:`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.6,
          maxOutputTokens: 350,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[geminiVoiceAgent] API error:", res.status, errText);
      throw new Error(`Gemini API error: ${res.status}`);
    }

    const data: any = await res.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) {
      throw new Error("No text output from Gemini");
    }

    const parsed: VoiceTurnResponse = JSON.parse(rawJson);
    return parsed;
  } catch (err: any) {
    console.error("[geminiVoiceAgent] fallback turn generation:", err.message);
    // Robust heuristic fallback if API rate-limited or offline
    const lower = req.customerSpeech.toLowerCase();
    const isAgree = /yes|haan|sure|bhej|send|ok|book|chahiye/i.test(lower);
    const isHuman = /manager|human|agent|talk to|transfer/i.test(lower);

    if (isHuman) {
      return {
        agentResponse: "I completely understand! I am transferring your call directly to our store manager right away. Please hold.",
        detectedPhase: "ESCALATION",
        sentiment: "skeptical",
        scoreBand: "HOT",
        extractedEntities: { intent: "Manager Escalation" },
        keyEntityTags: ["Manager Transfer"],
        whatsAppPushed: false,
        isTerminal: true,
        outcome: "escalated",
      };
    }

    if (isAgree) {
      return {
        agentResponse: `Certainly! I have just dispatched our complete product catalog and exclusive quotation link directly to your WhatsApp. Thank you for choosing ${storeName}!`,
        detectedPhase: "CLOSE",
        sentiment: "positive",
        scoreBand: "HOT",
        extractedEntities: { intent: "Customer Inquiry & Order Confirmation", timeline: "Immediate" },
        keyEntityTags: ["WhatsApp Catalog Sent", "Order Booked"],
        whatsAppPushed: true,
        isTerminal: true,
        outcome: "booked",
      };
    }

    return {
      agentResponse: `Hello! This is ${persona} calling from ${storeName}. We have fresh stock and special bulk discounts available today. Shall I send our complete catalog to your WhatsApp?`,
      detectedPhase: "QUALIFICATION",
      sentiment: "curious",
      scoreBand: "WARM",
      extractedEntities: { intent: "General Inquiry" },
      keyEntityTags: ["Inquiry"],
      whatsAppPushed: false,
      isTerminal: false,
      outcome: "follow_up",
    };
  }
}

export interface PostCallSummary {
  executiveSummary: string;
  actionItems: string[];
  objectionsRaised: string[];
  outcome: "booked" | "follow_up" | "not_interested" | "escalated";
  scoreBand: "HOT" | "WARM" | "COLD";
}

export async function generatePostCallSummary(
  transcript: Array<{ speaker: string; text: string }>,
  storeName: string,
  leadName: string
): Promise<PostCallSummary> {
  const conversation = transcript.map((t) => `${t.speaker}: "${t.text}"`).join("\n");
  const prompt = `You are an elite Sales Operations AI analyzing a completed retail phone call between store "${storeName}" and customer "${leadName}".
Conversation Transcript:
${conversation}

Analyze the dialogue and return ONLY a valid JSON object with:
{
  "executiveSummary": "Concise 2-3 sentence executive note summarizing customer requirements, agreements made, and current status",
  "actionItems": ["Actionable next task 1", "task 2"],
  "objectionsRaised": ["List of customer hesitations, pricing inquiries, or objections resolved"],
  "outcome": "booked" | "follow_up" | "not_interested" | "escalated",
  "scoreBand": "HOT" | "WARM" | "COLD"
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
          maxOutputTokens: 400,
        },
      }),
    });

    if (!res.ok) throw new Error(`Gemini status ${res.status}`);
    const data: any = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(raw);
  } catch (err) {
    return {
      executiveSummary: `Customer ${leadName} contacted ${storeName}. Call completed with interest logged.`,
      actionItems: ["Follow up with WhatsApp catalog and pricing quote"],
      objectionsRaised: [],
      outcome: "follow_up",
      scoreBand: "WARM",
    };
  }
}

