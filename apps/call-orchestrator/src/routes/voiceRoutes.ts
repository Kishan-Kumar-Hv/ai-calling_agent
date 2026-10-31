import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { Store } from "../models/Store";
import { CallRecord } from "../models/CallRecord";
import { MissedCall } from "../models/MissedCall";
import { Product } from "../models/Product";
import { processVoiceTurn, VoiceTurnRequest, generatePostCallSummary, CatalogProduct } from "../services/geminiVoiceAgent";
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
      name: "Crust & Crumb Artisan Bakery",
      category: "Artisan Bakery & Patisserie",
      personaName: "Riya",
      phone: "+91 93539 02221",
      observedGaps: ["Custom birthday cake pre-orders"],
    };

    let ownerId: any = null;
    let shopRecord: any = null;
    let liveCatalog: CatalogProduct[] = [];

    if (shopId && isMongoConnected()) {
      const isObjectId = mongoose.Types.ObjectId.isValid(shopId);
      if (isObjectId) {
        shopRecord = await Store.findById(shopId);
      }
      if (shopRecord) {
        ownerId = shopRecord.ownerId;
        storeContext = {
          name: shopRecord.name,
          category: shopRecord.category,
          personaName: shopRecord.aiSettings?.personaName || "Riya",
          phone: shopRecord.phone,
          observedGaps: shopRecord.observedGaps || [],
        };

        // ── Fetch live catalog for this shop ─────────────────────────────
        const products = await Product.find({ shopId: shopRecord._id, isActive: true }).sort({ category: 1, name: 1 }).limit(50);
        liveCatalog = products.map((p) => ({
          id:             p._id.toString(),
          name:           p.name,
          description:    p.description,
          category:       p.category,
          priceRetail:    p.priceRetail,
          priceWholesale: p.priceWholesale,
          unit:           p.unit,
          minOrderQty:    p.minOrderQty,
          maxOrderQty:    p.maxOrderQty,
          stockStatus:    p.stockStatus,
          tags:           p.tags,
        }));
      }
    }

    const turnReq: VoiceTurnRequest = {
      storeContext,
      catalog: liveCatalog,
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

// Endpoint to summarize conversation transcript
router.post("/summarize", async (req: Request, res: Response) => {
  try {
    const { transcript = [], storeName = "Retail Store", leadName = "Customer" } = req.body;
    if (!transcript || transcript.length === 0) {
      res.json({
        executiveSummary: "Call ended with no conversational dialogue recorded.",
        actionItems: ["Attempt callback during active hours"],
        objectionsRaised: [],
        outcome: "follow_up",
        scoreBand: "WARM",
      });
      return;
    }
    const summary = await generatePostCallSummary(transcript, storeName, leadName);
    res.json(summary);
  } catch (err: any) {
    console.error("[voiceRoutes] summarize error:", err);
    res.status(500).json({ error: "Failed to generate call summary" });
  }
});

// Endpoint to save complete call session with notes to MongoDB Atlas
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
      transcript = [],
      extractedEntities = {},
      callNotes,
      actionItems,
      objectionsRaised,
      whatsAppPushed,
      twilioDetails,
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

    // Generate comprehensive notes if not provided
    let finalNotes = callNotes;
    let finalActions = actionItems || [];
    let finalObjections = objectionsRaised || [];
    let finalOutcome = callOutcome;
    let finalScoreBand = scoreBand || "HOT";

    if (!finalNotes && transcript.length > 1) {
      try {
        const autoSum = await generatePostCallSummary(transcript, shop.name, leadName || "Customer");
        finalNotes = autoSum.executiveSummary;
        if (!finalActions.length) finalActions = autoSum.actionItems;
        if (!finalObjections.length) finalObjections = autoSum.objectionsRaised;
        if (!finalOutcome) finalOutcome = autoSum.outcome;
        if (!scoreBand) finalScoreBand = autoSum.scoreBand;
      } catch (e) {
        finalNotes = `Call with ${leadName || "customer"} regarding ${extractedEntities?.intent || "store inquiry"} concluded.`;
      }
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
      scoreBand: finalScoreBand,
      durationSec: durationSec || 45,
      callOutcome: finalOutcome || "booked",
      transcript: transcript || [],
      extractedEntities: extractedEntities || {},
      callNotes: finalNotes || "",
      actionItems: finalActions,
      objectionsRaised: finalObjections,
      twilioDetails: twilioDetails || {},
      whatsAppPushed: Boolean(whatsAppPushed),
      whatsAppOpened: Boolean(whatsAppPushed),
    });

    // Automatically update matching missed call in queue with notes and completion status
    if (leadPhoneNumber) {
      await MissedCall.findOneAndUpdate(
        { shopId: shop._id, phoneNumber: leadPhoneNumber },
        {
          status: "completed",
          duration: `${Math.floor((durationSec || 45) / 60)}m ${(durationSec || 45) % 60}s`,
          outcome: finalOutcome || "booked",
          scoreBand: finalScoreBand,
          callNotes: finalNotes || "",
          actionItems: finalActions,
          lastCallAttempt: "Just now",
        }
      );
    }

    // Update store metrics
    await Store.findByIdAndUpdate(shop._id, {
      $inc: { "metrics.totalMissedRecovered": 1 },
    });

    res.status(201).json({
      success: true,
      id: record._id.toString(),
      callNotes: finalNotes,
      actionItems: finalActions,
      callOutcome: finalOutcome,
    });
  } catch (err: any) {
    console.error("[voiceRoutes] record error:", err);
    res.status(500).json({ error: "Failed to save call record" });
  }
});

// Endpoint to fetch full recorded call details for PDF generation & inspection
router.get("/detail", async (req: Request, res: Response) => {
  try {
    const { phone, callSid, shopId } = req.query;
    if (!isMongoConnected()) {
      res.status(503).json({ error: "Database unavailable" });
      return;
    }
    const filter: any = {};
    if (callSid) filter.callSid = callSid;
    else if (phone) {
      const digits = (phone as string).replace(/\D/g, "").slice(-10);
      const flexiblePattern = digits.split("").join("\\s*");
      filter.leadPhoneNumber = { $regex: flexiblePattern, $options: "i" };
      if (shopId) filter.shopId = shopId;
    }
    const record = await CallRecord.findOne(filter).sort({ createdAt: -1 });
    if (!record) {
      res.status(404).json({ error: "Call record not found" });
      return;
    }
    res.json(record);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to retrieve call detail" });
  }
});

import { exec } from "child_process";
import fs from "fs";
import path from "path";

// Deepgram Aura Text-to-Speech Streaming Endpoint (POST & GET) + Guaranteed Hardware Speaker Playback
const handleTtsRequest = async (req: Request, res: Response) => {
  try {
    const text = (req.method === "GET" ? req.query.text : req.body.text) as string;
    const model = ((req.method === "GET" ? req.query.model : req.body.model) as string) || "aura-asteria-en";

    if (!text || !text.trim()) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    const audioBuffer = await generateDeepgramSpeech(text, model);

    // Hardware Playback on macOS: bypass browser autoplay security restrictions completely!
    if (process.platform === "darwin") {
      const tempAudioFile = path.join("/tmp", `riya_speech_${Date.now()}.mp3`);
      fs.writeFile(tempAudioFile, audioBuffer, () => {
        exec(`afplay "${tempAudioFile}"`, () => {
          fs.unlink(tempAudioFile, () => {});
        });
      });
    }

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length.toString(),
      "Cache-Control": "public, max-age=3600",
      "Accept-Ranges": "bytes",
    });
    res.send(audioBuffer);
  } catch (err: any) {
    console.error("[voiceRoutes] TTS error:", err);
    res.status(500).json({ error: "TTS generation failed" });
  }
};

router.post("/tts", handleTtsRequest);
router.get("/tts", handleTtsRequest);

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

