import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
import express from "express";
import fetch from "node-fetch";
import type { CanonicalLead } from "@involynk/shared";
import { syncLeadToHubSpot } from "./hubspot";

const app = express();
app.use(express.json());

const PORT = Number(process.env.CRM_SYNC_PORT ?? 8081);
const MAX_RETRIES = 3;

const deadLetterQueue: CanonicalLead[] = [];

async function sendWhatsAppFollowUp(lead: CanonicalLead) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.WHATSAPP_SENDER_NUMBER ?? "+14155238886";
  const portfolioUrl = process.env.PORTFOLIO_URL ?? "https://involynk.com/portfolio";

  if (!accountSid || !authToken) {
    console.error("[crm-sync] Twilio credentials missing for WhatsApp follow-up");
    return;
  }

  // Only follow up if lead outcome indicates interest
  if (lead.callOutcome !== "booked" && lead.callOutcome !== "follow_up") {
    console.log(`[crm-sync] skipping WhatsApp follow-up for outcome: ${lead.callOutcome}`);
    return;
  }

  console.log(`[crm-sync] Sending automated WhatsApp follow-up to ${lead.phoneNumber}...`);
  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const bodyText = `Hi ${lead.companyName ?? "there"}! Great talking to you just now. As promised, here is our portfolio and proof of work showing how we double walk-in customers: ${portfolioUrl}. We handle all the setup work for you, like building fast websites and Google Maps listings. Check out our past client results there and reply directly to this message to get started! - Riya`;

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: `whatsapp:${lead.phoneNumber}`,
        From: `whatsapp:${fromNumber}`,
        Body: bodyText,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as { sid: string };
      console.log(`[crm-sync] WhatsApp follow-up successfully sent! Message SID: ${data.sid}`);
    } else {
      const errText = await res.text();
      console.error(`[crm-sync] Twilio WhatsApp API failed: ${errText}`);
    }
  } catch (err) {
    console.error("[crm-sync] Failed to send WhatsApp follow-up", err);
  }
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "crm-sync", dlqSize: deadLetterQueue.length });
});

app.post("/leads/sync", async (req, res) => {
  const lead = req.body as CanonicalLead;
  res.status(202).json({ accepted: true });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await syncLeadToHubSpot(lead);
      console.log(`[crm-sync] synced lead ${lead.phoneNumber} (call ${lead.callSid}) on attempt ${attempt}`);
      sendWhatsAppFollowUp(lead); // Trigger WhatsApp follow-up
      return;
    } catch (err) {
      console.error(`[crm-sync] sync attempt ${attempt} failed for call ${lead.callSid}`, err);
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
  }

  console.error(`[crm-sync] giving up on call ${lead.callSid}, moving to DLQ`);
  deadLetterQueue.push(lead);
});

app.get("/leads/dlq", (_req, res) => {
  res.json(deadLetterQueue);
});

app.listen(PORT, () => {
  console.log(`[crm-sync] listening on http://localhost:${PORT}`);
});
