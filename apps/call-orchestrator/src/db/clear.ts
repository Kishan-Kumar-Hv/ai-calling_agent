import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
import mongoose from "mongoose";
import { User } from "../models/User";
import { Store } from "../models/Store";
import { MissedCall } from "../models/MissedCall";
import { CallRecord } from "../models/CallRecord";

async function clearDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI is missing in .env");
    process.exit(1);
  }

  const preserveAdmin = process.argv.includes("--preserve-admin");

  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  console.log("Connected to MongoDB Atlas!");

  console.log("\n🧹 Removing all data from collections...");
  const callRecordsResult = await CallRecord.deleteMany({});
  const missedCallsResult = await MissedCall.deleteMany({});
  const storesResult = await Store.deleteMany({});
  
  let usersResult;
  if (preserveAdmin) {
    usersResult = await User.deleteMany({ role: { $ne: "super_admin" } });
    console.log("Preserved super_admin account(s).");
  } else {
    usersResult = await User.deleteMany({});
  }

  console.log(`✓ Deleted ${callRecordsResult.deletedCount} call records / talks.`);
  console.log(`✓ Deleted ${missedCallsResult.deletedCount} missed calls.`);
  console.log(`✓ Deleted ${storesResult.deletedCount} stores.`);
  console.log(`✓ Deleted ${usersResult.deletedCount} users.`);
  console.log("\n✨ Database is completely wiped clean and ready for live data!");

  await mongoose.disconnect();
  process.exit(0);
}

clearDatabase().catch((err) => {
  console.error("❌ Error clearing database:", err);
  process.exit(1);
});

