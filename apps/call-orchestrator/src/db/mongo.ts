import mongoose from "mongoose";

let isConnected = false;

export async function connectMongoDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn("\n⚠️  [mongodb] MONGODB_URI not detected in .env.");
    console.warn("👉  Set MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/involynk in .env to connect live MongoDB Atlas.");
    console.warn("🛡️   Running resilient tenant isolation engine in safe fallback mode.\n");
    return false;
  }

  try {
    if (isConnected) return true;

    console.log("[mongodb] Connecting to MongoDB Atlas cluster...");
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log("✅  [mongodb] Successfully connected to live MongoDB Atlas!");
    return true;
  } catch (err) {
    console.error("❌  [mongodb] MongoDB Atlas connection failed:", (err as Error).message);
    console.warn("🛡️   Continuing with isolated in-memory tenant state to ensure uninterrupted service.\n");
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

