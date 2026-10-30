import { Router, Request, Response } from "express";
import { Store } from "../models/Store";
import { CallRecord } from "../models/CallRecord";
import { processVoiceTurn, VoiceTurnRequest } from "../services/geminiVoiceAgent";
import { generateDeepgramSpeech, transcribeDeepgramAudio } from "../services/deepgramService";
import { isMongoConnected } from "../db/mongo";

const router = Router();

router.post("/turn", async (req: Request, res: Response) => {
  try {
    const {
      shopId,
      customerSpeech,
      conversationHistory = [],
      currentPhase = "DISCOVERY",
      callSid = `CA_${Date.now()}`,
      leadName = "Customer",
      leadPhoneNumber = "+919999999999",
    } = req.body;

    if (!customerSpeech) {
      res.status(400).json({ error: "customerSpeech is required" });
      return;
    }

    let storeContext = {
      name: "Involynk Retail Branch",
      category: "Retail",
      personaName: "Riya",
      phone: "+91 84319 80422",
      observedGaps: ["local walk-in optimization"],
    };

    let ownerId: any = null;
    let shopRecord: any = null;

    if (shopId && isMongoConnected()) {
      shopRecord = await Store.findById(shopId);
      if (shopRecord) {
        ownerId = shopRecord.ownerId;
        storeContext = {
          name: shopRecord.name,
          category: shopRecord.category,
          personaName: shopRecord.aiSettings?.personaName || "Riya",
          phone: shopRecord.phone,
          observedGaps: shopRecord.observedGaps || [],
        };
      }
    }

    const turnReq: VoiceTurnRequest = {
      storeContext,
      callerName: leadName,
      customerSpeech,
      conversationHistory,
      currentPhase,
    };

    const analysis = await processVoiceTurn(turnReq);

    // If call is terminal or completed, record in MongoDB Atlas
    if (analysis.isTerminal && isMongoConnected() && ownerId && shopRecord) {
      const fullTranscript = [
        ...conversationHistory,
        { speaker: "customer", text: customerSpeech, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
        { speaker: "agent", text: analysis.agentResponse, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ];

      await CallRecord.create({
        ownerId,
        shopId: shopRecord._id,
        shopName: shopRecord.name,
        ownerName: "Business Owner",
        callSid,
        leadName,
        leadPhoneNumber,
        phase: analysis.detectedPhase,
        sentiment: analysis.sentiment,
        scoreBand: analysis.scoreBand,
        durationSec: fullTranscript.length * 15,
        callOutcome: analysis.outcome || (analysis.scoreBand === "HOT" ? "booked" : "follow_up"),
        transcript: fullTranscript.map((t) => ({
          speaker: t.speaker,
          text: t.text,
          timestamp: t.timestamp || "00:30",
          entities: analysis.keyEntityTags,
        })),
        extractedEntities: analysis.extractedEntities,
        whatsAppPushed: analysis.whatsAppPushed,
        whatsAppOpened: analysis.whatsAppPushed,
      });

      // Increment store metrics
      await Store.findByIdAndUpdate(shopRecord._id, {
        $inc: { "metrics.totalMissedRecovered": 1 },
      });
    }

    res.json(analysis);
  } catch (err: any) {
    console.error("[voiceRoutes] error:", err);
    res.status(500).json({ error: "Failed to process voice turn" });
  }
});

// Endpoint to save complete call session to MongoDB Atlas
router.post("/record", async (req: Request, res: Response) => {
  try {
    const {
      shopId,
      callSid,
      leadName,
      leadPhoneNumber,
      phase,
      sentiment,
      scoreBand,
      durationSec,
      callOutcome,
      transcript,
      extractedEntities,
      whatsAppPushed,
    } = req.body;

    if (!isMongoConnected()) {
      res.status(503).json({ error: "Database unavailable" });
      return;
    }

    const shop = await Store.findById(shopId);
    if (!shop) {
      res.status(404).json({ error: "Store not found" });
      return;
    }

    const record = await CallRecord.create({
      ownerId: shop.ownerId,
      shopId: shop._id,
      shopName: shop.name,
      ownerName: "Store Owner",
      callSid: callSid || `CA_${Date.now()}`,
      leadName: leadName || "Customer",
      leadPhoneNumber: leadPhoneNumber || "+919999999999",
      phase: phase || "CLOSE",
      sentiment: sentiment || "positive",
      scoreBand: scoreBand || "HOT",
      durationSec: durationSec || 45,
      callOutcome: callOutcome || "booked",
      transcript: transcript || [],
      extractedEntities: extractedEntities || {},
      whatsAppPushed: Boolean(whatsAppPushed),
      whatsAppOpened: Boolean(whatsAppPushed),
    });

    // Update store metrics
    await Store.findByIdAndUpdate(shop._id, {
      $inc: { "metrics.totalMissedRecovered": 1 },
    });

    res.status(201).json({ success: true, id: record._id.toString() });
  } catch (err: any) {
    console.error("[voiceRoutes] record error:", err);
    res.status(500).json({ error: "Failed to save call record" });
  }
});

// Deepgram Aura Text-to-Speech Streaming Endpoint
router.post("/tts", async (req: Request, res: Response) => {
  try {
    const { text, model = "aura-asteria-en" } = req.body;
    if (!text || !text.trim()) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    const audioBuffer = await generateDeepgramSpeech(text, model);
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length.toString(),
      "Cache-Control": "public, max-age=3600",
    });
    res.send(audioBuffer);
  } catch (err: any) {
    console.error("[voiceRoutes] TTS error:", err);
    res.status(500).json({ error: "TTS generation failed" });
  }
});

// Deepgram Nova-2 Audio Transcription Endpoint
router.post("/stt", async (req: Request, res: Response) => {
  try {
    const contentType = req.headers["content-type"] || "audio/webm";
    const chunks: Buffer[] = [];

    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", async () => {
      try {
        const audioBuffer = Buffer.concat(chunks);
        if (audioBuffer.length === 0) {
          res.status(400).json({ error: "Audio buffer is empty" });
          return;
        }

        const result = await transcribeDeepgramAudio(audioBuffer, contentType);
        res.json(result);
      } catch (e: any) {
        res.status(500).json({ error: e.message || "STT failed" });
      }
    });
  } catch (err: any) {
    console.error("[voiceRoutes] STT error:", err);
    res.status(500).json({ error: "STT processing failed" });
  }
});

export { router as voiceRouter };

