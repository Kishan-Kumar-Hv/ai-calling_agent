import fetch from "node-fetch";

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || "";

/**
 * Deepgram Aura Text-to-Speech (TTS)
 * Models: aura-asteria-en (Warm/Empathetic Female), aura-luna-en, aura-stella-en, aura-orion-en
 */
export async function generateDeepgramSpeech(
  text: string,
  model: string = "aura-asteria-en"
): Promise<Buffer> {
  if (!text || !text.trim()) {
    throw new Error("Text is required for TTS");
  }

  const url = `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Token ${DEEPGRAM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[deepgramService] TTS error:", res.status, errText);
    throw new Error(`Deepgram TTS API failed: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Deepgram Nova-2 Speech-to-Text (STT)
 */
export async function transcribeDeepgramAudio(
  audioBuffer: Buffer,
  contentType: string = "audio/webm"
): Promise<{ transcript: string; confidence: number }> {
  const url = "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Token ${DEEPGRAM_API_KEY}`,
      "Content-Type": contentType,
    },
    body: audioBuffer,
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[deepgramService] STT error:", res.status, errText);
    throw new Error(`Deepgram STT API failed: ${res.status}`);
  }

  const data: any = await res.json();
  const transcript =
    data.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
  const confidence =
    data.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

  return { transcript, confidence };
}

