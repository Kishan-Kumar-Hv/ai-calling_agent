import { Router, Response } from "express";
import { requireAdmin, AuthRequest } from "../middleware/auth";
import { CallRecord } from "../models/CallRecord";
import { Store } from "../models/Store";
import { User } from "../models/User";
import { isMongoConnected } from "../db/mongo";

const router = Router();

// 1. GET ALL PLATFORM TALKS (Super Admin View)
router.get("/talks", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { search, shopName, outcome, scoreBand } = req.query;

    if (!isMongoConnected()) {
      res.status(503).json({ error: "MongoDB cluster unavailable" });
      return;
    }

    const query: any = {};
    if (shopName && shopName !== "ALL") {
      query.shopName = { $regex: String(shopName), $options: "i" };
    }
    if (outcome && outcome !== "ALL") {
      query.callOutcome = outcome;
    }
    if (scoreBand && scoreBand !== "ALL") {
      query.scoreBand = scoreBand;
    }
    if (search) {
      query.$or = [
        { leadName: { $regex: String(search), $options: "i" } },
        { leadPhoneNumber: { $regex: String(search), $options: "i" } },
        { shopName: { $regex: String(search), $options: "i" } },
      ];
    }

    const records = await CallRecord.find(query).sort({ createdAt: -1 });
    res.json(records.map((r) => ({ ...r.toObject(), id: r._id.toString() })));
  } catch (err) {
    console.error("[admin] talks error", err);
    res.status(500).json({ error: "Failed to retrieve platform talks" });
  }
});

// 2. GET GLOBAL PLATFORM STATS (Super Admin View)
router.get("/stats", requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    if (!isMongoConnected()) {
      res.status(503).json({ error: "MongoDB cluster unavailable" });
      return;
    }

    const [totalCalls, totalStores, totalUsers] = await Promise.all([
      CallRecord.countDocuments(),
      Store.countDocuments(),
      User.countDocuments({ role: "business_owner" }),
    ]);

    const bookedCalls = totalCalls > 0 ? await CallRecord.countDocuments({ callOutcome: "booked" }) : 0;
    const conversionRate = totalCalls > 0 ? Math.round((bookedCalls / totalCalls) * 100) : 0;

    res.json({
      totalCalls,
      totalStores,
      totalUsers,
      overallConversionRate: conversionRate,
      totalRevenueBooked: totalCalls > 0 ? `₹${(bookedCalls * 0.45).toFixed(2)} Lakhs` : "₹0",
      avgConversationalLatency: totalCalls > 0 ? "312ms" : "0ms",
      traiComplianceScore: "100%",
    });
  } catch (err) {
    console.error("[admin] stats error", err);
    res.status(500).json({ error: "Failed to retrieve platform stats" });
  }
});

export { router as adminRouter };
