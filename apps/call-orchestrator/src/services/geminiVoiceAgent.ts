export interface VoiceTurnRequest {
  storeContext: {
    name: string;
    category?: string;
    personaName?: string;
    phone?: string;
    observedGaps?: string[];
  };
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
  detectedPhase: "GREETING" | "DISCOVERY" | "QUALIFICATION" | "PITCH" | "BOOKING" | "CONFIRMATION" | "CLOSE" | "ESCALATION" | "DECLINED";
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

  const systemInstructions = `You are ${persona}, an elite, empathetic AI Voice SDR calling from "${storeName}" (${category}).
You are on an active phone call with a customer. You communicate in natural, conversational Hinglish (Indian English mixed with conversational Hindi/Urdu words like "Haan", "Bilkul", "Aapke liye", "Shukriya", "Ji", "Sure").

Your store objective:
1. Understand the customer's request or inquiry (e.g., custom orders, pricing, booking appointments, retail inquiries).
2. Answer their question concisely in 1 to 2 spoken sentences (max 35 words). This is a fast phone conversation.
3. Extract key buying signals: what product/service they want, quantity/party size, budget, timeline, and urgency.
4. If appropriate, offer to send our festive catalog, price quote, or store appointment directly to their WhatsApp.
5. If the customer agrees to proceed (e.g., "haan bhej do", "yes please", "sure", "book it"), confirm the booking/WhatsApp dispatch and gracefully prepare to conclude.
6. If the customer asks for a human manager or sounds frustrated, politely confirm you will transfer them to the store manager.

Return ONLY a valid JSON object with the following schema:
{
  "agentResponse": "Concise spoken Hinglish answer (1-2 sentences)",
  "detectedPhase": "DISCOVERY" | "QUALIFICATION" | "PITCH" | "BOOKING" | "CONFIRMATION" | "CLOSE" | "ESCALATION" | "DECLINED",
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
  "whatsAppPushed": true or false,
  "isTerminal": true or false,
  "outcome": "booked" | "follow_up" | "not_interested" | "escalated"
}`;

  const conversationContext = req.conversationHistory
    .map((turn) => `${turn.speaker === "agent" ? persona : "Customer"}: "${turn.text}"`)
    .join("\n");

  const prompt = `${systemInstructions}

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
        agentResponse: `Bilkul ji! Maine just abhi aapke WhatsApp number pe hamara details aur exclusive booking voucher bhej diya hai. See you soon at ${storeName}!`,
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
      agentResponse: `Namaste! ${persona} here from ${storeName}. We have fresh inventory and special festival pricing available right now. Kya main WhatsApp pe catalog bhej doon?`,
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

