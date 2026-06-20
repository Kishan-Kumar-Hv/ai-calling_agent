import { WebSocket } from "ws";
import { buildAgentSettingsMessage, AgentSettingsOptions } from "./settings";

export interface AgentSessionCallbacks {
  onAudioFrame: (mulawBuffer: Buffer) => void;
  onConversationText: (role: "user" | "assistant", content: string) => void;
  onUserStartedSpeaking?: () => void;
  onError?: (err: unknown) => void;
  onClose?: () => void;
}

export function openAgentSession(
  callbacks: AgentSessionCallbacks,
  options?: Omit<AgentSettingsOptions, "googleApiKey">
): WebSocket {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("DEEPGRAM_API_KEY is not set");
  if (!googleApiKey) throw new Error("GOOGLE_API_KEY is not set");

  const ws = new WebSocket("wss://agent.deepgram.com/v1/agent/converse", {
    headers: { Authorization: `Token ${apiKey}` },
  });

  ws.on("open", () => {
    console.log("[deepgram-agent] websocket open, sending Settings");
    const settings = buildAgentSettingsMessage({ googleApiKey, ...options });
    ws.send(JSON.stringify(settings));
  });

  ws.on("message", (data, isBinary) => {
    if (isBinary) {
      callbacks.onAudioFrame(data as Buffer);
      return;
    }

    try {
      const msg = JSON.parse(data.toString());
      switch (msg.type) {
        case "ConversationText":
          callbacks.onConversationText(msg.role === "user" ? "user" : "assistant", msg.content ?? "");
          break;
        case "UserStartedSpeaking":
          callbacks.onUserStartedSpeaking?.();
          break;
        case "Error":
          console.error("[deepgram-agent] Error message", msg);
          callbacks.onError?.(msg);
          break;
        default:
          console.log(`[deepgram-agent] event: ${msg.type}`);
          break;
      }
    } catch (err) {
      callbacks.onError?.(err);
    }
  });

  ws.on("error", (err) => callbacks.onError?.(err));
  ws.on("close", (code, reason) => {
    console.log(`[deepgram-agent] websocket closed code=${code} reason=${reason?.toString()}`);
    callbacks.onClose?.();
  });

  return ws;
}

export function sendAudioToAgent(agentWs: WebSocket, mulawBase64: string): void {
  if (agentWs.readyState !== agentWs.OPEN) return;
  const buffer = Buffer.from(mulawBase64, "base64");
  agentWs.send(buffer);
}
