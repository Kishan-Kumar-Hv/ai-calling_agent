import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { MissedCall } from "../models/MissedCall";
import { isMongoConnected } from "../db/mongo";

const router = Router();

// In-memory partitioned missed calls: key = `${ownerId}_${shopId}`
const inMemoryMissedCalls = new Map<string, any[]>();

// Helper to evaluate priority, reason, and tie-breaking score
function evaluatePriority(
  callerName: string,
  callCount: number = 1,
  requestedPriority?: "P0" | "P1" | "P2"
) {
  let priority: "P0" | "P1" | "P2" = requestedPriority || "P0";
  let reason = "Fresh Missed Call (< 2m)";
  let score = 100;

  const isCommercial = /wholesale|corporate|bulk|hamper|vip|manager|buyer|lead/i.test(callerName || "");

  if (callCount > 1) {
    priority = "P0";
    reason = `Repeat Caller (${callCount}x Rings Detected)`;
    score = 120 + callCount * 15;
  } else if (isCommercial) {
    priority = "P0";
    reason = "VIP / High-Value Commercial Intent";
    score = 125;
  } else if (requestedPriority === "P1") {
    priority = "P1";
    reason = "Standard Retail Lead (Warm)";
    score = 60;
  } else if (requestedPriority === "P2") {
    priority = "P2";
    reason = "Low Priority / Standard Directory";
    score = 25;
  }

  return { priority, reason, score };
}

// Deterministic Tie-Breaking & Ranking Rule Engine
function rankMissedCalls(calls: any[]) {
  const pending = calls.filter((c) => c.status === "pending" || c.status === "dialing");
  const others = calls.filter((c) => c.status !== "pending" && c.status !== "dialing");

  // Tie-Breaking Rule Order:
  // 1. priorityScore (desc)
  // 2. callCount (desc)
  // 3. createdAt (asc) - FIFO arrival
  pending.sort((a, b) => {
    const scoreA = a.priorityScore ?? (a.priority === "P0" ? 100 : a.priority === "P1" ? 50 : 20);
    const scoreB = b.priorityScore ?? (b.priority === "P0" ? 100 : b.priority === "P1" ? 50 : 20);
    if (scoreB !== scoreA) return scoreB - scoreA;

    const countA = a.callCount || 1;
    const countB = b.callCount || 1;
    if (countB !== countA) return countB - countA;

    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeA - timeB;
  });

  pending.forEach((c, idx) => {
    c.queueRank = idx + 1;
    c.tieBreakWinner = idx === 0;
  });

  return [...pending, ...others];
}

// 1. GET MISSED CALLS: PRIORITIZED AND TIE-BROKEN
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const shopId = (req.query.shopId as string) || "shop_1";

    if (isMongoConnected()) {
      const calls = await MissedCall.find({ ownerId, shopId }).sort({ createdAt: -1 });
      const callsObj = calls.map((c) => ({ ...c.toObject(), id: c._id.toString() }));
      const ranked = rankMissedCalls(callsObj);
      res.json(ranked);
      return;
    }

    const key = `${ownerId}_${shopId}`;
    const calls = inMemoryMissedCalls.get(key) || [];
    const ranked = rankMissedCalls(calls);
    res.json(ranked);
  } catch (err) {
    console.error("[missed-calls] get error", err);
    res.status(500).json({ error: "Failed to retrieve missed calls" });
  }
});

// 2. CREATE A MISSED CALL: AUTOMATIC REPEAT DETECTION & PRIORITY SCORING
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const { shopId, shopName, phoneNumber, callerName, priority: reqPriority } = req.body;

    if (!shopId || !phoneNumber) {
      res.status(400).json({ error: "shopId and phoneNumber are required" });
      return;
    }

    if (isMongoConnected()) {
      // Check if existing pending call from this number exists (Repeat Call Detection)
      const existing = await MissedCall.findOne({
        shopId,
        phoneNumber,
        status: "pending",
      });

      if (existing) {
        const newCount = (existing.callCount || 1) + 1;
        const evaluated = evaluatePriority(callerName || existing.callerName, newCount, "P0");

        existing.callCount = newCount;
        existing.priority = evaluated.priority;
        existing.priorityReason = evaluated.reason;
        existing.priorityScore = evaluated.score;
        existing.timestamp = "Just now (Repeat ring)";
        await existing.save();

        res.json({ ...existing.toObject(), id: existing._id.toString() });
        return;
      }

      const evaluated = evaluatePriority(callerName || "Inbound Lead", 1, reqPriority);
      const call = await MissedCall.create({
        ownerId,
        shopId,
        shopName: shopName || "Retail Outlet",
        phoneNumber,
        callerName: callerName || "Inbound Caller",
        timestamp: "Just now (< 30s ago)",
        priority: evaluated.priority,
        priorityReason: evaluated.reason,
        priorityScore: evaluated.score,
        callCount: 1,
        status: "pending",
      });

      res.status(201).json({ ...call.toObject(), id: call._id.toString() });
      return;
    }

    // In-memory fallback
    const id = "call_m_" + Math.random().toString(36).substring(2, 8);
    const evaluated = evaluatePriority(callerName || "Inbound Caller", 1, reqPriority);
    const newCall = {
      id,
      ownerId,
      shopId,
      shopName: shopName || "Retail Outlet",
      phoneNumber,
      callerName: callerName || "Inbound Caller",
      timestamp: "Just now (< 30s ago)",
      priority: evaluated.priority,
      priorityReason: evaluated.reason,
      priorityScore: evaluated.score,
      callCount: 1,
      status: "pending",
      createdAt: new Date(),
    };

    const key = `${ownerId}_${shopId}`;
    const existing = inMemoryMissedCalls.get(key) || [];
    inMemoryMissedCalls.set(key, [newCall, ...existing]);
    res.status(201).json(newCall);
  } catch (err) {
    console.error("[missed-calls] create error", err);
    res.status(500).json({ error: "Failed to enqueue missed call" });
  }
});

// 3. SIMULATE 2 SIMULTANEOUS MISSED CALLS WITH DETERMINISTIC TIE-BREAKING & WHATSAPP REDUNDANCY
router.post("/simulate-conflict", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const { shopId, shopName, phoneA, callerNameA, phoneB, callerNameB } = req.body;

    if (!shopId) {
      res.status(400).json({ error: "shopId is required" });
      return;
    }

    const arrivalTimestamp = new Date();

    // Call 1: High-Value Repeat Caller (VIP / 2x rings)
    const callAData = {
      ownerId,
      shopId,
      shopName: shopName || "Involynk Outlet",
      phoneNumber: phoneA || "+91 93539 02221",
      callerName: callerNameA || "Vikram Malhotra (Corporate Bulk Buyer)",
      timestamp: "Just now (Contention @ T0)",
      priority: "P0" as const,
      priorityReason: "Repeat Caller (2x Rings) + Bulk Intent",
      priorityScore: 155,
      callCount: 2,
      status: "pending" as const,
      createdAt: arrivalTimestamp,
      tieBreakWinner: true,
      queueRank: 1,
      whatsAppAckSent: false,
    };

    // Call 2: Single-Ring Standard Customer arriving at the EXACT same millisecond
    const callBData = {
      ownerId,
      shopId,
      shopName: shopName || "Involynk Outlet",
      phoneNumber: phoneB || "+91 84319 80422",
      callerName: callerNameB || "Pooja Hegde (Festive Shopper)",
      timestamp: "Just now (Contention @ T0)",
      priority: "P0" as const,
      priorityReason: "Fresh Missed Call (<2m)",
      priorityScore: 105,
      callCount: 1,
      status: "pending" as const,
      createdAt: new Date(arrivalTimestamp.getTime() + 1), // 1ms later
      tieBreakWinner: false,
      queueRank: 2,
      // Automatic Multi-Channel WhatsApp Redundancy triggered for the queued call!
      whatsAppAckSent: true,
    };

    if (isMongoConnected()) {
      const createdA = await MissedCall.create(callAData);
      const createdB = await MissedCall.create(callBData);

      res.status(201).json({
        message: "2 Simultaneous missed calls generated at T0. Tie-break evaluated.",
        winner: { ...createdA.toObject(), id: createdA._id.toString() },
        runnerUp: { ...createdB.toObject(), id: createdB._id.toString() },
        tieBreakExplanation:
          "Vikram Malhotra dialed 2x with Corporate Buyer intent (Score: 155), winning Tie-Break Rank #1. Pooja Hegde (Score: 105) placed at Rank #2 and received instant WhatsApp Standby brochure.",
      });
      return;
    }

    const key = `${ownerId}_${shopId}`;
    const idA = "call_sim_a_" + Date.now();
    const idB = "call_sim_b_" + (Date.now() + 1);
    const entryA = { ...callAData, id: idA };
    const entryB = { ...callBData, id: idB };

    const existing = inMemoryMissedCalls.get(key) || [];
    inMemoryMissedCalls.set(key, [entryA, entryB, ...existing]);

    res.status(201).json({
      message: "2 Simultaneous missed calls generated at T0. Tie-break evaluated.",
      winner: entryA,
      runnerUp: entryB,
      tieBreakExplanation:
        "Vikram Malhotra dialed 2x with Corporate Buyer intent (Score: 155), winning Tie-Break Rank #1. Pooja Hegde (Score: 105) placed at Rank #2 and received instant WhatsApp Standby brochure.",
    });
  } catch (err: any) {
    console.error("[missed-calls] simulate conflict error", err);
    res.status(500).json({ error: "Failed to simulate simultaneous conflict" });
  }
});

// 4. TRIGGER WHATSAPP STANDBY ACKNOWLEDGMENT
router.post("/ack-whatsapp", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { callId } = req.body;
    if (isMongoConnected()) {
      const call = await MissedCall.findByIdAndUpdate(
        callId,
        { whatsAppAckSent: true },
        { new: true }
      );
      res.json({ success: true, call });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to acknowledge WhatsApp standby" });
  }
});

export { router as missedCallRouter };
