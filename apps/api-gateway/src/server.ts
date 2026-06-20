import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
import express from "express";

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const PORT = Number(process.env.API_GATEWAY_PORT ?? 3000);
const VOICE_PIPELINE_WS_URL = process.env.VOICE_PIPELINE_WS_URL ?? "wss://example.ngrok.io/media-stream";

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

// Twilio calls this webhook once the outbound call is answered.
// tenantId / leadPhoneNumber are passed as query params by the Call Orchestrator
// when it places the call, and forwarded into the media stream as custom parameters.
app.post("/voice/twiml", (req, res) => {
  const tenantId = (req.query.tenantId as string) ?? "default";
  const leadPhoneNumber = (req.query.leadPhoneNumber as string) ?? req.body.To ?? "unknown";

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${VOICE_PIPELINE_WS_URL}">
      <Parameter name="tenantId" value="${tenantId}" />
      <Parameter name="leadPhoneNumber" value="${leadPhoneNumber}" />
    </Stream>
  </Connect>
</Response>`;

  res.type("text/xml").send(twiml);
});

app.listen(PORT, () => {
  console.log(`[api-gateway] listening on http://localhost:${PORT}`);
});
