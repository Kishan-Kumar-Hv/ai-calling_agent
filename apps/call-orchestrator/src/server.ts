import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
import express from "express";
import twilio from "twilio";

const app = express();
app.use(express.json());

const PORT = Number(process.env.CALL_ORCHESTRATOR_PORT ?? 4000);
const VOICE_PIPELINE_WS_URL = process.env.VOICE_PIPELINE_WS_URL ?? "wss://example.ngrok.io/media-stream";

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "call-orchestrator" });
});

interface PlaceCallBody {
  tenantId: string;
  leadPhoneNumber: string;
  leadName?: string;
  businessName?: string;
  observedLack?: string;
  bypassTimeGuardrails?: boolean;
}

const DND_REGISTRY = ["+919999999999", "+919876543210"];

app.post("/calls/outbound", async (req, res) => {
  const { tenantId, leadPhoneNumber, leadName, businessName, observedLack, bypassTimeGuardrails } = req.body as PlaceCallBody;

  if (!leadPhoneNumber) {
    res.status(400).json({ error: "leadPhoneNumber is required" });
    return;
  }

  // 1. DND Scrubbing
  if (DND_REGISTRY.includes(leadPhoneNumber)) {
    res.status(400).json({ error: "DND Block: This number is registered on the DND/NCPR registry." });
    return;
  }

  // 2. TRAI Time Guardrails (9:30 AM to 7:30 PM IST)
  if (!bypassTimeGuardrails && process.env.NODE_ENV !== "test") {
    const kolkataDateStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const kolkataDate = new Date(kolkataDateStr);
    const hour = kolkataDate.getHours();
    const minute = kolkataDate.getMinutes();
    const timeInMinutes = hour * 60 + minute;
    const startLimit = 9 * 60 + 30; // 9:30 AM
    const endLimit = 19 * 60 + 30; // 7:30 PM

    if (timeInMinutes < startLimit || timeInMinutes > endLimit) {
      res.status(400).json({ error: "TRAI Violation: Out of allowed calling hours (9:30 AM to 7:30 PM IST)." });
      return;
    }
  }

  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  if (!fromNumber) {
    res.status(500).json({ error: "TWILIO_FROM_NUMBER not configured" });
    return;
  }

  try {
    // Inline TwiML avoids needing api-gateway's webhook to be internet-reachable
    // for outbound calls -- only voice-pipeline's WebSocket needs to be exposed.
    const twiml = new twilio.twiml.VoiceResponse();
    const connect = twiml.connect();
    const stream = connect.stream({ url: VOICE_PIPELINE_WS_URL });
    stream.parameter({ name: "tenantId", value: tenantId ?? "default" });
    stream.parameter({ name: "leadPhoneNumber", value: leadPhoneNumber });
    if (leadName) stream.parameter({ name: "leadName", value: leadName });
    if (businessName) stream.parameter({ name: "businessName", value: businessName });
    if (observedLack) stream.parameter({ name: "observedLack", value: observedLack });

    const call = await twilioClient.calls.create({
      to: leadPhoneNumber,
      from: fromNumber,
      twiml: twiml.toString(),
      machineDetection: "Enable", // Enable Twilio Answering Machine Detection (AMD)
    });

    res.json({ callSid: call.sid, status: call.status });
  } catch (err) {
    console.error("[call-orchestrator] failed to place call", err);
    res.status(502).json({ error: "Failed to place outbound call" });
  }
});

app.listen(PORT, () => {
  console.log(`[call-orchestrator] listening on http://localhost:${PORT}`);
});
