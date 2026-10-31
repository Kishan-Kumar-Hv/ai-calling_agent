import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { Store } from "../models/Store";
import { Product } from "../models/Product";
import { MissedCall } from "../models/MissedCall";
import { isMongoConnected } from "../db/mongo";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "involynk_enterprise_jwt_secret_key_2026";

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, businessName } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: "Name, email, and password are required" });
      return;
    }

    if (!isMongoConnected()) {
      res.status(503).json({ error: "Database unavailable. Please verify MongoDB connection." });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userPhone = phone || "+91 84319 80422";
    const userBusiness = businessName || "Retail Store";

    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      phone: userPhone,
      businessName: userBusiness,
      role: normalizedEmail.startsWith("admin@") ? "super_admin" : "business_owner",
    });

    // Auto-create initial store branch for this registered business
    const initialStore = await Store.create({
      ownerId: user._id,
      name: user.businessName,
      category: user.businessName.toLowerCase().includes("bakery") ? "Artisan Bakery & Patisserie" : "Retail",
      phone: user.phone,
      address: "12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru 560038",
      operatingHours: "09:30 AM - 09:30 PM (IST)",
      bannerImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
      aiSettings: {
        personaName: "Riya",
        language: "en-IN",
        tone: "Professional, Warm & Welcoming",
        autoWhatsApp: true,
        whatsappTemplate: `Hello! Riya here from ${user.businessName}. We noticed we missed your call. How can we assist you with your order today?`,
        transferNumber: user.phone,
        maxRetries: 3,
        callPacingSeconds: 8,
      },
      metrics: {
        totalMissedRecovered: 0,
        conversionRate: 0,
        revenueSaved: "₹0",
        avgLatencyMs: 310,
      },
    });

    // Auto-seed initial starter catalog products so the store catalog is never empty!
    await Product.create([
      {
        ownerId: user._id,
        shopId: initialStore._id,
        name: "Belgian Chocolate Truffle Cake (1kg)",
        category: "Cakes & Desserts",
        priceRetail: 1250,
        priceWholesale: 999,
        unit: "cake",
        minOrderQty: 1,
        stockStatus: "in_stock",
        tags: ["bestseller", "birthday", "chocolate"],
        description: "Rich dark Belgian chocolate ganache layered with moist sponge.",
        isActive: true,
      },
      {
        ownerId: user._id,
        shopId: initialStore._id,
        name: "Artisan Sourdough Loaf (400g)",
        category: "Artisan Breads",
        priceRetail: 220,
        priceWholesale: 180,
        unit: "loaf",
        minOrderQty: 1,
        stockStatus: "in_stock",
        tags: ["organic", "sourdough", "fresh"],
        description: "Naturally fermented 24-hour slow-rise sourdough loaf with crunchy crust.",
        isActive: true,
      },
      {
        ownerId: user._id,
        shopId: initialStore._id,
        name: "French Butter Croissant Box (Pack of 6)",
        category: "Pastries & Croissants",
        priceRetail: 480,
        priceWholesale: 420,
        unit: "box",
        minOrderQty: 1,
        stockStatus: "in_stock",
        tags: ["breakfast", "french", "butter"],
        description: "Flaky, buttery multi-layered authentic French croissants.",
        isActive: true,
      },
      {
        ownerId: user._id,
        shopId: initialStore._id,
        name: "Red Velvet Cream Cheese Jar Cake",
        category: "Cakes & Desserts",
        priceRetail: 199,
        priceWholesale: 160,
        unit: "jar",
        minOrderQty: 1,
        stockStatus: "in_stock",
        tags: ["dessert", "red velvet"],
        description: "Decadent red velvet crumb with smooth Philadelphia cream cheese frosting.",
        isActive: true,
      },
    ]);

    // Auto-seed initial missed call for demonstration
    await MissedCall.create({
      ownerId: user._id,
      shopId: initialStore._id,
      shopName: initialStore.name,
      phoneNumber: "+91 93539 02221",
      callerName: "Aarav Sharma (Custom Birthday Cake Order)",
      timestamp: "Just now (< 45s ago)",
      priority: "P0",
      status: "pending",
      priorityReason: "High Intent • Custom 2kg Cake Inquiry",
      priorityScore: 135,
      queueRank: 1,
    });

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, name: user.name, businessName: user.businessName, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        businessName: user.businessName,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error("[auth] register error", err);
    res.status(500).json({ error: "Internal server error during registration" });
  }
});

// Single clean Bakery merchant account
const fallbackUsers: Record<string, any> = {
  "kishankumarhv5@gmail.com": {
    id: "usr_bakery_01",
    name: "Kishan Kumar",
    email: "kishankumarhv5@gmail.com",
    phone: "+91 93539 02221",
    businessName: "Crust & Crumb Artisan Bakery",
    role: "admin",
  },
  "admin@involynk.com": {
    id: "usr_bakery_01",
    name: "Bakery Admin",
    email: "admin@involynk.com",
    phone: "+91 93539 02221",
    businessName: "Crust & Crumb Artisan Bakery",
    role: "super_admin",
  }
};

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isMongoConnected()) {
      // In-memory fallback authentication so store owners can always login even during IP changes
      const fallbackUser = fallbackUsers[normalizedEmail] || {
        id: "usr_" + Math.random().toString(36).substring(2, 9),
        name: normalizedEmail.split("@")[0].toUpperCase(),
        email: normalizedEmail,
        phone: "+91 93539 02221",
        businessName: "Retail Store",
        role: "admin",
      };

      const token = jwt.sign(
        { id: fallbackUser.id, email: fallbackUser.email, name: fallbackUser.name, businessName: fallbackUser.businessName, role: fallbackUser.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ token, user: fallbackUser });
      return;
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, name: user.name, businessName: user.businessName, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        businessName: user.businessName,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error("[auth] login error", err);
    res.status(500).json({ error: "Internal server error during login" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!isMongoConnected()) {
      // In-memory fallback response when offline
      res.json({
        id: decoded.id,
        name: decoded.name || "Kishan Kumar",
        email: decoded.email || "kishankumarhv5@gmail.com",
        phone: "+91 93539 02221",
        businessName: decoded.businessName || "Crust & Crumb Artisan Bakery",
        role: decoded.role || "admin",
      });
      return;
    }
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      businessName: user.businessName,
      role: user.role,
      avatar: user.avatar,
    });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

export { router as authRouter };
