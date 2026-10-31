import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { Store } from "../models/Store";
import { isMongoConnected } from "../db/mongo";

const router = Router();

// In-memory fallback stores partitioned by ownerId
const inMemoryStores = new Map<string, any[]>();

// Seed default stores for demo owner "usr_kishan_99" and default bakery
const bakeryStore = {
  id: "shop_bakery_01",
  name: "Crust & Crumb Artisan Bakery",
  category: "Artisan Bakery & Patisserie",
  phone: "+91 93539 02221",
  address: "12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru 560038",
  operatingHours: "09:30 AM - 07:30 PM (IST)",
  bannerImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
  observedGaps: [
    "High missed calls for custom birthday & wedding cakes during morning rush",
    "No automated WhatsApp menu link sent to missed callers",
  ],
  aiSettings: {
    personaName: "Riya",
    language: "en-IN",
    tone: "Professional, Warm & Welcoming",
    autoWhatsApp: true,
    whatsappTemplate: "Hello {{name}}! Riya from {{shop_name}}. Sorry we missed your call. Here is our fresh artisan bakery menu and custom cake pre-order link: {{portfolio_url}}",
    transferNumber: "+91 93539 02221",
    maxRetries: 3,
    callPacingSeconds: 8,
  },
  twilioConfig: {
    phoneNumber: process.env.TWILIO_FROM_NUMBER || "+15752213417",
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    enabled: true,
  },
  metrics: {
    totalMissedRecovered: 84,
    conversionRate: 74.2,
    revenueSaved: "₹1,26,000",
    avgLatencyMs: 310,
  },
};

inMemoryStores.set("usr_kishan_99", [bakeryStore]);

// 1. GET ALL STORES: STRICTLY FILTERED BY OWNER ID
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;

    if (isMongoConnected()) {
      const stores = await Store.find({ ownerId }).sort({ createdAt: -1 });
      res.json(stores.map((s) => ({ ...s.toObject(), id: s._id.toString() })));
      return;
    }

    // In-memory isolated store list
    let stores = inMemoryStores.get(ownerId);
    if (!stores || stores.length === 0) {
      // Single clean Artisan Bakery Store
      stores = [
        {
          id: "shop_bakery_01",
          ownerId,
          name: "Crust & Crumb Artisan Bakery",
          category: "Artisan Bakery & Patisserie",
          phone: "+91 93539 02221",
          address: "12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru 560038",
          operatingHours: "09:30 AM - 07:30 PM (IST)",
          bannerImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
          observedGaps: [
            "High missed calls for custom birthday & wedding cakes during morning rush",
            "No automated WhatsApp menu link sent to missed callers",
          ],
          aiSettings: {
            personaName: "Riya",
            language: "en-IN",
            tone: "Professional, Warm & Welcoming",
            autoWhatsApp: true,
            whatsappTemplate: "Hello {{name}}! Riya from {{shop_name}}. Sorry we missed your call. Here is our fresh artisan bakery menu and custom cake pre-order link: {{portfolio_url}}",
            transferNumber: "+91 93539 02221",
            maxRetries: 3,
            callPacingSeconds: 8,
          },
          twilioConfig: {
            phoneNumber: process.env.TWILIO_FROM_NUMBER || "+15752213417",
            accountSid: process.env.TWILIO_ACCOUNT_SID || "",
            authToken: process.env.TWILIO_AUTH_TOKEN || "",
            enabled: true,
          },
          metrics: {
            totalMissedRecovered: 84,
            conversionRate: 74.2,
            revenueSaved: "₹1,26,000",
            avgLatencyMs: 310,
          },
        }
      ];
      inMemoryStores.set(ownerId, stores);
    }
    res.json(stores);
  } catch (err) {
    console.error("[shops] list error", err);
    res.status(500).json({ error: "Failed to retrieve stores" });
  }
});

// 2. CREATE A NEW STORE: ASSIGNED TO AUTHENTICATED OWNER
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const { name, category, phone, address, operatingHours, bannerImage, observedGaps, aiSettings } = req.body;

    if (!name || !phone) {
      res.status(400).json({ error: "Store name and helpline phone number are required" });
      return;
    }

    if (isMongoConnected()) {
      const store = await Store.create({
        ownerId,
        name,
        category: category || "Retail",
        phone,
        address: address || "Bangalore, Karnataka",
        operatingHours: operatingHours || "09:30 AM - 09:30 PM (IST)",
        bannerImage:
          bannerImage ||
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
        observedGaps: observedGaps || ["Unlisted on local maps", "No automated callback during rush"],
        aiSettings: aiSettings || {
          personaName: "Riya",
          language: "hinglish",
          tone: "Friendly & Empathetic",
          autoWhatsApp: true,
          whatsappTemplate: "Hi {{name}}! Calling from {{shop_name}}. Catalog: {{portfolio_url}}",
          transferNumber: phone,
          maxRetries: 3,
          callPacingSeconds: 8,
        },
        metrics: { totalMissedRecovered: 0, conversionRate: 0, revenueSaved: "₹0", avgLatencyMs: 310 },
      });

      res.status(201).json({ ...store.toObject(), id: store._id.toString() });
      return;
    }

    // In-memory fallback
    const id = "shop_" + Math.random().toString(36).substring(2, 9);
    const newStore = {
      id,
      ownerId,
      name,
      category: category || "Retail",
      phone,
      address: address || "Bangalore, Karnataka",
      operatingHours: operatingHours || "09:30 AM - 09:30 PM (IST)",
      bannerImage:
        bannerImage ||
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
      observedGaps: observedGaps || ["Unlisted on local maps"],
      aiSettings: aiSettings || {
        personaName: "Riya",
        language: "hinglish",
        tone: "Friendly & Empathetic",
        autoWhatsApp: true,
        whatsappTemplate: "Hi {{name}}! Calling from {{shop_name}}. Catalog: {{portfolio_url}}",
        transferNumber: phone,
        maxRetries: 3,
        callPacingSeconds: 8,
      },
      metrics: { totalMissedRecovered: 0, conversionRate: 0, revenueSaved: "₹0", avgLatencyMs: 310 },
    };

    const existing = inMemoryStores.get(ownerId) || [];
    inMemoryStores.set(ownerId, [newStore, ...existing]);
    res.status(201).json(newStore);
  } catch (err) {
    console.error("[shops] create error", err);
    res.status(500).json({ error: "Failed to create store" });
  }
});

// 3. UPDATE STORE: VERIFIES OWNER ID (CANNOT EDIT OTHER TENANT'S STORE)
router.put("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const storeId = req.params.id;

    if (isMongoConnected()) {
      const store = await Store.findOne({ _id: storeId, ownerId });
      if (!store) {
        res.status(404).json({ error: "Store not found or you do not have permission to edit this outlet" });
        return;
      }

      Object.assign(store, req.body);
      await store.save();
      res.json({ ...store.toObject(), id: store._id.toString() });
      return;
    }

    // In-memory fallback
    const stores = inMemoryStores.get(ownerId) || [];
    const idx = stores.findIndex((s) => s.id === storeId);
    if (idx === -1) {
      res.status(404).json({ error: "Store not found or you do not have permission to edit this outlet" });
      return;
    }

    stores[idx] = { ...stores[idx], ...req.body, id: storeId, ownerId };
    inMemoryStores.set(ownerId, stores);
    res.json(stores[idx]);
  } catch (err) {
    console.error("[shops] update error", err);
    res.status(500).json({ error: "Failed to update store" });
  }
});

export { router as shopRouter };

