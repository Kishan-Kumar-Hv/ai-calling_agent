import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
import fs from "fs";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Store } from "../models/Store";
import { MissedCall } from "../models/MissedCall";

async function importLeads() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI is missing in .env");
    process.exit(1);
  }

  const csvPath = path.resolve(__dirname, "../../../../leads.csv");
  if (!fs.existsSync(csvPath)) {
    console.error("❌ leads.csv file not found at", csvPath);
    process.exit(1);
  }

  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  console.log("Connected to MongoDB Atlas!");

  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim().length > 0);

  // Skip header line
  const dataLines = lines.slice(1);
  console.log(`Found ${dataLines.length} lead records in leads.csv`);

  const passwordHash = await bcrypt.hash("password123", 10);

  for (const line of dataLines) {
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < 4) continue;
    const [phoneNumber, ownerName, businessName, ...observedLackParts] = parts;
    const observedLack = observedLackParts.join(",");

    const email = `${ownerName.toLowerCase().replace(/\s+/g, "")}@involynk.com`;

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: ownerName,
        email,
        passwordHash,
        phone: phoneNumber,
        businessName,
        role: "business_owner",
      });
      console.log(`Created user account for: ${ownerName} (${email})`);
    }

    // Find or create store
    let store = await Store.findOne({ ownerId: user._id, name: businessName });
    if (!store) {
      store = await Store.create({
        ownerId: user._id,
        name: businessName,
        category: "Retail",
        phone: phoneNumber,
        address: "Bengaluru, Karnataka",
        operatingHours: "9:00 AM - 9:00 PM",
        observedGaps: [observedLack],
        bannerImage: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80",
        aiSettings: {
          personaName: "Riya",
          language: "hinglish",
          tone: "Friendly & Empathetic",
          autoWhatsApp: true,
          whatsappTemplate: `Hi! We noticed you missed our call regarding ${businessName}.`,
          transferNumber: phoneNumber,
          maxRetries: 3,
          callPacingSeconds: 60,
        },
        metrics: {
          totalMissedRecovered: 0,
          conversionRate: 0,
          revenueSaved: "₹0",
          avgLatencyMs: 310,
        },
      });
      console.log(`Created store: ${businessName}`);
    }

    // Create missed call entry in queue
    await MissedCall.create({
      ownerId: user._id,
      shopId: store._id,
      shopName: store.name,
      phoneNumber,
      callerName: ownerName,
      priority: phoneNumber.includes("9999999999") ? "P2" : "P0",
      status: "pending",
      duration: "0s",
      observedLack,
    });
    console.log(`Enqueued missed call lead: ${ownerName} (${phoneNumber})`);
  }

  console.log("\n✅ All live leads successfully imported into MongoDB Atlas!");
  await mongoose.disconnect();
  process.exit(0);
}

importLeads().catch((err) => {
  console.error("❌ Error importing leads:", err);
  process.exit(1);
});

