import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
import { WebSocket, WebSocketServer } from "ws";
import http from "http";
import fetch from "node-fetch";
import { createInitialCallState } from "@involynk/shared";
import type { CallState } from "@involynk/shared";
import { openAgentSession, sendAudioToAgent } from "./agent/deepgramAgent";
import { extractEntities, nextPhase, scoreLead } from "./llm/qualification";
import { reportCallEnded } from "./crmClient";

const PORT = Number(process.env.VOICE_PIPELINE_PORT ?? 8080);

const server = http.createServer();
const wss = new WebSocketServer({ server, path: "/media-stream" });

async function transferCall(callSid: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const transferNumber = process.env.TWILIO_TEAM_TRANSFER_NUMBER ?? "+918431980422";
  if (!accountSid || !authToken) {
    console.error("[voice-pipeline] Twilio credentials missing for transfer");
    return;
  }

  console.log(`[voice-pipeline] Redirecting call ${callSid} to team number ${transferNumber}...`);
  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const twiml = `<Response><Say>Please hold while I connect you to our manager.</Say><Dial>${transferNumber}</Dial></Response>`;
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ Twiml: twiml }),
    });

    if (res.ok) {
      console.log(`[voice-pipeline] Successfully redirected call ${callSid}`);
    } else {
      const errText = await res.text();
      console.error(`[voice-pipeline] Twilio redirect failed: ${errText}`);
    }
  } catch (err) {
    console.error("[voice-pipeline] Failed to transfer call", err);
  }
}

wss.on("connection", (twilioWs: WebSocket) => {
  console.log("[voice-pipeline] Twilio media stream connected");
  let state: CallState | null = null;
  let streamSid = "";
  let agentWs: WebSocket | null = null;
  let reported = false;

  function finalizeIfTerminal() {
    if (!state || reported) return;
    if (state.phase === "ESCALATION") {
      reported = true;
      reportCallEnded(state, "escalated");
      transferCall(state.callSid);
      twilioWs.close();
    } else if (state.phase === "DECLINED") {
      reported = true;
      reportCallEnded(state, "not_interested");
      twilioWs.close();
    } else if (state.phase === "CLOSE") {
      reported = true;
      console.log(`[calendar-booking] SUCCESS: Automatically booked demo calendar slot for lead ${state.leadPhoneNumber} (${state.entities.companyName ?? "local business"})`);
      reportCallEnded(state, state.scoreBand === "HOT" ? "booked" : "follow_up");
      twilioWs.close();
    }
  }

  twilioWs.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());

    switch (msg.event) {
      case "start": {
        streamSid = msg.start.streamSid;
        const callSid: string = msg.start.callSid;
        const tenantId: string = msg.start.customParameters?.tenantId ?? "default";
        const leadPhoneNumber: string = msg.start.customParameters?.leadPhoneNumber ?? "unknown";
        const leadName: string = msg.start.customParameters?.leadName ?? "there";
        const businessName: string = msg.start.customParameters?.businessName ?? "local business";
        const observedLack: string = msg.start.customParameters?.observedLack ?? "online presence";
        console.log(`[voice-pipeline] call started: callSid=${callSid} streamSid=${streamSid}`);
        state = createInitialCallState({ callSid, tenantId, leadPhoneNumber });

        agentWs = openAgentSession({
          onAudioFrame: (mulawBuffer) => {
            if (twilioWs.readyState === twilioWs.OPEN) {
              twilioWs.send(
                JSON.stringify({ event: "media", streamSid, media: { payload: mulawBuffer.toString("base64") } })
              );
            }
          },
          onConversationText: (role, content) => {
            console.log(`[transcript] ${role}: ${content}`);
            if (!state || !content) return;
            state.transcript.push({
              speaker: role === "user" ? "customer" : "agent",
              text: content,
              timestamp: Date.now(),
            });

            if (role === "user") {
              extractEntities(state, content);
              state.phase = nextPhase(state.phase, content);
              if (state.phase === "OBJECTION_HANDLING") state.objectionCount += 1;
              state.scoreBand = scoreLead(state);
              finalizeIfTerminal();
            }
          },
          onUserStartedSpeaking: () => {
            // Barge-in: clear any audio Twilio is still playing back to the caller.
            if (twilioWs.readyState === twilioWs.OPEN) {
              twilioWs.send(JSON.stringify({ event: "clear", streamSid }));
            }
          },
          onError: (err) => console.error("[deepgram-agent] error", err),
          onClose: () => console.log(`[deepgram-agent] session closed for call ${callSid}`),
        }, {
          leadName,
          businessName,
          observedLack
        });
        break;
      }
      case "media": {
        if (agentWs) sendAudioToAgent(agentWs, msg.media.payload);
        break;
      }
      case "stop": {
        console.log("[voice-pipeline] Twilio sent stop event");
        agentWs?.close();
        break;
      }
      default:
        break;
    }
  });

  twilioWs.on("close", () => {
    console.log("[voice-pipeline] Twilio media stream closed");
    agentWs?.close();
    if (!reported && state) {
      reported = true;
      const transcriptText = state.transcript.map((t) => t.text.toLowerCase()).join(" ");
      const isInterested =
        state.phase === "BOOKING" ||
        state.phase === "CONFIRMATION" ||
        state.phase === "CLOSE" ||
        transcriptText.includes("whatsapp") ||
        transcriptText.includes("send") ||
        transcriptText.includes("details") ||
        /yes|sure|ok|okay|send it/.test(transcriptText);

      reportCallEnded(state, isInterested ? "follow_up" : "not_interested");
    }
  });
});

server.listen(PORT, () => {
  console.log(`[voice-pipeline] listening on ws://localhost:${PORT}/media-stream`);
});
