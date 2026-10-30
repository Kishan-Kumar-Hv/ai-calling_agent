import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
import express from "express";
import twilio from "twilio";
import { connectMongoDB, isMongoConnected } from "./db/mongo";
import { authRouter } from "./routes/authRoutes";
import { shopRouter } from "./routes/shopRoutes";
import { missedCallRouter } from "./routes/missedCallRoutes";
import { adminRouter } from "./routes/adminRoutes";
import { voiceRouter } from "./routes/voiceRoutes";

const app = express();
app.use(express.json());

// Enable CORS for web console
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-owner-id, x-owner-email, x-admin-key");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

const PORT = Number(process.env.CALL_ORCHESTRATOR_PORT ?? 4000);
const VOICE_PIPELINE_WS_URL = process.env.VOICE_PIPELINE_WS_URL ?? "wss://example.ngrok.io/media-stream";

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// In-memory 72h Cooldown and Deduplication Ledger
const callCooldownMap = new Map<string, number>();
const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;

// Mount MongoDB Multi-Tenant Routes
app.use("/api/auth", authRouter);
app.use("/api/shops", shopRouter);
app.use("/api/missed-calls", missedCallRouter);
app.use("/api/admin", adminRouter);
app.use("/api/voice", voiceRouter);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "call-orchestrator",
    mongoConnected: isMongoConnected(),
    cooldownsTracked: callCooldownMap.size,
  });
});

interface PlaceCallBody {
  tenantId: string;
  leadPhoneNumber: string;
  leadName?: string;
  businessName?: string;
  observedLack?: string;
  bypassTimeGuardrails?: boolean;
  priority?: "P0" | "P1" | "P2";
}

const DND_REGISTRY = ["+919999999999", "+919876543210"];

app.post("/calls/outbound", async (req, res) => {
  const { tenantId, leadPhoneNumber, leadName, businessName, observedLack, bypassTimeGuardrails, priority } = req.body as PlaceCallBody;

  if (!leadPhoneNumber) {
    res.status(400).json({ error: "leadPhoneNumber is required" });
    return;
  }

  // 1. DND Scrubbing
  if (DND_REGISTRY.includes(leadPhoneNumber)) {
    res.status(400).json({ error: "DND Block: This number is registered on the DND/NCPR registry." });
    return;
  }

  // 2. 72-Hour Anti-Harassment & Deduplication Cooldown Guard
  const lastCalled = callCooldownMap.get(leadPhoneNumber);
  if (lastCalled && !bypassTimeGuardrails) {
    const timeSinceCall = Date.now() - lastCalled;
    if (timeSinceCall < SEVENTY_TWO_HOURS_MS) {
      const remainingHours = Math.ceil((SEVENTY_TWO_HOURS_MS - timeSinceCall) / (1000 * 60 * 60));
      res.status(429).json({
        error: `Cooldown Active: Lead was dialed recently. Next retry permitted in ${remainingHours} hours.`,
      });
      return;
    }
  }

  // 3. TRAI Time Guardrails (9:30 AM to 7:30 PM IST)
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
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !fromNumber) {
    callCooldownMap.set(leadPhoneNumber, Date.now());
    res.json({
      callSid: `CA_voice_${Date.now()}`,
      status: "in-progress",
      priority: priority ?? "P0",
      mode: "browser_voice",
    });
    return;
  }

  try {
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
      machineDetection: "Enable",
    });

    callCooldownMap.set(leadPhoneNumber, Date.now());

    res.json({ callSid: call.sid, status: call.status, priority: priority ?? "P0" });
  } catch (err) {
    console.error("[call-orchestrator] failed to place call", err);
    res.status(502).json({ error: "Failed to place outbound call" });
  }
});

// Start Server and initialize MongoDB connection
app.listen(PORT, async () => {
  console.log(`[call-orchestrator] listening on http://localhost:${PORT}`);
  await connectMongoDB();
});
