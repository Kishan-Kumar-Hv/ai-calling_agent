import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { Product } from "../models/Product";
import { Store } from "../models/Store";
import { isMongoConnected } from "../db/mongo";

const router = Router();

// ─── In-Memory Fallback ───────────────────────────────────────────────────────
// keyed by `${ownerId}_${shopId}`
const inMemoryProducts = new Map<string, any[]>();

function memKey(ownerId: string, shopId: string) {
  return `${ownerId}_${shopId}`;
}

// Default sample bakery products
const defaultBakeryProducts = [
  {
    id: "prod_b_01",
    name: "Belgium Chocolate Truffle Cake (1kg)",
    category: "Cakes & Desserts",
    priceRetail: 1250,
    priceWholesale: 999,
    unit: "cake",
    minOrderQty: 1,
    stockStatus: "in_stock",
    tags: ["bestseller", "birthday", "chocolate"],
    description: "Rich dark Belgian chocolate ganache layered with moist sponge.",
  },
  {
    id: "prod_b_02",
    name: "Artisan Sourdough Loaf (400g)",
    category: "Artisan Breads",
    priceRetail: 220,
    priceWholesale: 180,
    unit: "loaf",
    minOrderQty: 1,
    stockStatus: "in_stock",
    tags: ["organic", "sourdough", "fresh"],
    description: "Naturally fermented 24-hour slow-rise sourdough loaf with crunchy crust.",
  },
  {
    id: "prod_b_03",
    name: "French Butter Croissant Box (Pack of 6)",
    category: "Pastries & Croissants",
    priceRetail: 480,
    priceWholesale: 420,
    unit: "box",
    minOrderQty: 1,
    stockStatus: "in_stock",
    tags: ["breakfast", "french", "butter"],
    description: "Flaky, buttery multi-layered authentic French croissants.",
  },
  {
    id: "prod_b_04",
    name: "Red Velvet Cream Cheese Jar Cake",
    category: "Cakes & Desserts",
    priceRetail: 199,
    priceWholesale: 160,
    unit: "jar",
    minOrderQty: 1,
    stockStatus: "in_stock",
    tags: ["dessert", "red velvet"],
    description: "Decadent red velvet crumb with smooth Philadelphia cream cheese frosting.",
  }
];

// ─── 1. GET ALL PRODUCTS FOR A SHOP ──────────────────────────────────────────
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const shopId  = req.query.shopId as string;

    if (!shopId) {
      res.status(400).json({ error: "shopId query param is required" });
      return;
    }

    if (isMongoConnected()) {
      const products = await Product.find({ ownerId, shopId, isActive: true }).sort({ category: 1, name: 1 });
      res.json(products.map((p) => ({ ...p.toObject(), id: p._id.toString() })));
      return;
    }

    const key = memKey(ownerId, shopId);
    let items = inMemoryProducts.get(key);
    if (!items || items.length === 0) {
      items = defaultBakeryProducts.map(p => ({ ...p, ownerId, shopId, isActive: true }));
      inMemoryProducts.set(key, items);
    }
    res.json(items.filter((p) => p.isActive !== false));
  } catch (err) {
    console.error("[catalog] list error", err);
    res.status(500).json({ error: "Failed to retrieve catalog" });
  }
});

// ─── 2. GET ALL PRODUCTS (for AI – no auth, keyed by shopId only) ─────────────
// Used internally by voiceRoutes to inject live catalog into Gemini prompt
router.get("/for-ai/:shopId", async (req, res: Response) => {
  try {
    const { shopId } = req.params;

    if (isMongoConnected()) {
      const products = await Product.find({ shopId, isActive: true }).sort({ category: 1, name: 1 });
      res.json(products.map((p) => ({ ...p.toObject(), id: p._id.toString() })));
      return;
    }

    // Fallback: find by shopId across all owners
    let found: any[] = [];
    for (const [key, items] of inMemoryProducts) {
      if (key.endsWith("_" + shopId)) {
        found = items.filter((p) => p.isActive !== false);
        break;
      }
    }
    if (found.length === 0) {
      found = defaultBakeryProducts;
    }
    res.json(found);
  } catch (err) {
    console.error("[catalog] for-ai error", err);
    res.status(500).json({ error: "Failed to retrieve catalog for AI" });
  }
});

// ─── 3. CREATE PRODUCT ────────────────────────────────────────────────────────
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const {
      shopId,
      name,
      description,
      category,
      priceRetail,
      priceWholesale,
      unit,
      minOrderQty,
      maxOrderQty,
      stockStatus,
      stockQty,
      tags,
      imageUrl,
    } = req.body;

    if (!shopId || !name || priceRetail === undefined) {
      res.status(400).json({ error: "shopId, name, and priceRetail are required" });
      return;
    }

    // Verify the shop belongs to this owner
    if (isMongoConnected()) {
      const shop = await Store.findOne({ _id: shopId, ownerId });
      if (!shop) {
        res.status(403).json({ error: "Shop not found or not owned by you" });
        return;
      }

      const product = await Product.create({
        ownerId,
        shopId,
        name,
        description:    description  || "",
        category:       category     || "General",
        priceRetail,
        priceWholesale: priceWholesale ?? undefined,
        unit:           unit         || "piece",
        minOrderQty:    minOrderQty  ?? 1,
        maxOrderQty:    maxOrderQty  ?? undefined,
        stockStatus:    stockStatus  || "in_stock",
        stockQty:       stockQty     ?? undefined,
        tags:           tags         || [],
        imageUrl:       imageUrl     || undefined,
        isActive:       true,
      });

      res.status(201).json({ ...product.toObject(), id: product._id.toString() });
      return;
    }

    // In-memory fallback
    const key = memKey(ownerId, shopId);
    const id  = "prod_" + Math.random().toString(36).substring(2, 10);
    const product = {
      id, ownerId, shopId, name,
      description:    description  || "",
      category:       category     || "General",
      priceRetail,
      priceWholesale: priceWholesale ?? null,
      unit:           unit         || "piece",
      minOrderQty:    minOrderQty  ?? 1,
      maxOrderQty:    maxOrderQty  ?? null,
      stockStatus:    stockStatus  || "in_stock",
      stockQty:       stockQty     ?? null,
      tags:           tags         || [],
      imageUrl:       imageUrl     || null,
      isActive:       true,
      createdAt:      new Date().toISOString(),
    };
    const existing = inMemoryProducts.get(key) || [];
    inMemoryProducts.set(key, [...existing, product]);
    res.status(201).json(product);
  } catch (err) {
    console.error("[catalog] create error", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// ─── 4. UPDATE PRODUCT ────────────────────────────────────────────────────────
router.put("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const ownerId   = req.user!.id;
    const productId = req.params.id;

    if (isMongoConnected()) {
      const product = await Product.findOne({ _id: productId, ownerId });
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      Object.assign(product, req.body);
      await product.save();
      res.json({ ...product.toObject(), id: product._id.toString() });
      return;
    }

    // In-memory fallback
    let updated: any = null;
    for (const [key, items] of inMemoryProducts) {
      if (!key.startsWith(ownerId)) continue;
      const idx = items.findIndex((p) => p.id === productId);
      if (idx !== -1) {
        items[idx] = { ...items[idx], ...req.body, id: productId, ownerId };
        inMemoryProducts.set(key, items);
        updated = items[idx];
        break;
      }
    }
    if (!updated) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error("[catalog] update error", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// ─── 5. DELETE PRODUCT (soft delete) ─────────────────────────────────────────
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const ownerId   = req.user!.id;
    const productId = req.params.id;

    if (isMongoConnected()) {
      const product = await Product.findOne({ _id: productId, ownerId });
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      product.isActive = false;
      await product.save();
      res.json({ success: true });
      return;
    }

    for (const [key, items] of inMemoryProducts) {
      if (!key.startsWith(ownerId)) continue;
      const idx = items.findIndex((p) => p.id === productId);
      if (idx !== -1) {
        items[idx].isActive = false;
        inMemoryProducts.set(key, items);
        res.json({ success: true });
        return;
      }
    }
    res.status(404).json({ error: "Product not found" });
  } catch (err) {
    console.error("[catalog] delete error", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export { router as catalogRouter };

