import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { MissedCall } from "../models/MissedCall";
import { isMongoConnected } from "../db/mongo";

const router = Router();

// In-memory partitioned missed calls: key = `${ownerId}_${shopId}`
const inMemoryMissedCalls = new Map<string, any[]>();

// Seed initial missed calls for demo
inMemoryMissedCalls.set("usr_kishan_99_shop_1", [
  {
    id: "call_m1",
    ownerId: "usr_kishan_99",
    shopId: "shop_1",
    shopName: "Kishan Dry Fruits & Gourmet Spices",
    phoneNumber: "+91 98765 43210",
    callerName: "Rajesh Sharma",
    timestamp: "2 mins ago",
    priority: "P0",
    status: "pending",
  },
  {
    id: "call_m2",
    ownerId: "usr_kishan_99",
    shopId: "shop_1",
    shopName: "Kishan Dry Fruits & Gourmet Spices",
    phoneNumber: "+91 84319 80422",
    callerName: "Kishan Kumar (VIP)",
    timestamp: "6 mins ago",
    priority: "P0",
    status: "pending",
  },
  {
    id: "call_m3",
    ownerId: "usr_kishan_99",
    shopId: "shop_1",
    shopName: "Kishan Dry Fruits & Gourmet Spices",
    phoneNumber: "+91 99001 23456",
    callerName: "Priya Venkatesh",
    timestamp: "18 mins ago",
    priority: "P1",
    status: "completed",
    lastCallAttempt: "15 mins ago",
    duration: "1m 45s",
    outcome: "booked",
    scoreBand: "HOT",
  },
]);

// 1. GET MISSED CALLS: STRICTLY FILTERED BY OWNER AND STORE
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const shopId = (req.query.shopId as string) || "shop_1";

    if (isMongoConnected()) {
      const calls = await MissedCall.find({ ownerId, shopId }).sort({ createdAt: -1 });
      res.json(calls.map((c) => ({ ...c.toObject(), id: c._id.toString() })));
      return;
    }

    // In-memory isolated missed calls
    const key = `${ownerId}_${shopId}`;
    const calls = inMemoryMissedCalls.get(key) || [];
    res.json(calls);
  } catch (err) {
    console.error("[missed-calls] get error", err);
    res.status(500).json({ error: "Failed to retrieve missed calls" });
  }
});

// 2. CREATE A MISSED CALL: EXPLICITLY SCOPED TO THIS OWNER AND STORE
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const { shopId, shopName, phoneNumber, callerName, priority } = req.body;

    if (!shopId || !phoneNumber) {
      res.status(400).json({ error: "shopId and phoneNumber are required" });
      return;
    }

    if (isMongoConnected()) {
      const call = await MissedCall.create({
        ownerId,
        shopId,
        shopName: shopName || "Retail Outlet",
        phoneNumber,
        callerName: callerName || "Inbound Caller",
        timestamp: "Just now (< 30s ago)",
        priority: priority || "P0",
        status: "pending",
      });
      res.status(201).json({ ...call.toObject(), id: call._id.toString() });
      return;
    }

    // In-memory fallback
    const id = "call_m_" + Math.random().toString(36).substring(2, 8);
    const newCall = {
      id,
      ownerId,
      shopId,
      shopName: shopName || "Retail Outlet",
      phoneNumber,
      callerName: callerName || "Inbound Caller",
      timestamp: "Just now (< 30s ago)",
      priority: priority || "P0",
      status: "pending",
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

export { router as missedCallRouter };

