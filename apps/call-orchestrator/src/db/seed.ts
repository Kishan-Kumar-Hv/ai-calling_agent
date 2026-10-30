import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Store } from "../models/Store";
import { MissedCall } from "../models/MissedCall";
import { CallRecord } from "../models/CallRecord";

async function seedDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI is missing in .env");
    process.exit(1);
  }

  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  console.log(" Connected to MongoDB Atlas successfully!");

  console.log("\n🧹 Clearing existing collections in 'involynk' database...");
  await User.deleteMany({});
  await Store.deleteMany({});
  await MissedCall.deleteMany({});
  await CallRecord.deleteMany({});
  console.log("✓ Cleared users, stores, missed calls, and call records.");

  console.log("\n🌱 Seeding multi-tenant private businesses into MongoDB Atlas...");

  const passwordHash = await bcrypt.hash("password123", 10);

  // 0. SUPER ADMIN ACCOUNT: Platform Auditor / Supervisor
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const userAdmin = await User.create({
    name: "System Administrator",
    email: "admin@involynk.com",
    passwordHash: adminPasswordHash,
    phone: "+91 80000 00000",
    businessName: "Involynk Central Platform Administration",
    role: "super_admin",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80",
  });

  // 1. TENANT 1: Kishan Kumar (Dry Fruits Retail Chain)
  const userKishan = await User.create({
    name: "Kishan Kumar",
    email: "kishan@involynk.com",
    passwordHash,
    phone: "+91 84319 80422",
    businessName: "Kishan Enterprises Group",
    role: "business_owner",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  });

  const kishanStore1 = await Store.create({
    ownerId: userKishan._id,
    name: "Kishan Dry Fruits & Gourmet Spices",
    category: "Dry Fruits & Spices",
    phone: "+91 84319 80422",
    address: "Indiranagar 100ft Road, Stage 2, Bengaluru, Karnataka 560038",
    operatingHours: "09:30 AM - 09:30 PM (IST)",
    bannerImage: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80",
    observedGaps: [
      "No Google Maps Local Listing (losing walk-ins to nearby dry fruit stores)",
      "Unoptimized website with >4.8s mobile load time",
      "No automated WhatsApp order callback during festival rush",
    ],
    aiSettings: {
      personaName: "Riya",
      language: "hinglish",
      tone: "Friendly & Empathetic",
      autoWhatsApp: true,
      whatsappTemplate:
        "Hi {{name}}! Riya from {{shop_name}}. Sorry we missed your call. Here is our gourmet festive wholesale catalog: {{portfolio_url}}",
      transferNumber: "+91 84319 80422",
      maxRetries: 3,
      callPacingSeconds: 8,
    },
    metrics: {
      totalMissedRecovered: 142,
      conversionRate: 68.4,
      revenueSaved: "₹1,84,500",
      avgLatencyMs: 340,
    },
  });

  const kishanStore2 = await Store.create({
    ownerId: userKishan._id,
    name: "Kishan Dry Fruits - Jayanagar Branch",
    category: "Dry Fruits & Spices",
    phone: "+91 84319 80422",
    address: "9th Main, 4th Block, Jayanagar, Bengaluru 560011",
    operatingHours: "09:30 AM - 09:30 PM (IST)",
    bannerImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    observedGaps: [
      "Missing corporate bulk order slot booking on mobile",
    ],
    aiSettings: {
      personaName: "Riya",
      language: "hinglish",
      tone: "Friendly & Empathetic",
      autoWhatsApp: true,
      whatsappTemplate: "Hi {{name}}! Calling from Jayanagar branch. Here is our direct catalog: {{portfolio_url}}",
      transferNumber: "+91 84319 80422",
      maxRetries: 3,
      callPacingSeconds: 8,
    },
    metrics: {
      totalMissedRecovered: 48,
      conversionRate: 62.5,
      revenueSaved: "₹64,000",
      avgLatencyMs: 320,
    },
  });

  // Missed calls for Kishan's Store 1
  await MissedCall.create([
    {
      ownerId: userKishan._id,
      shopId: kishanStore1._id,
      shopName: kishanStore1.name,
      phoneNumber: "+91 98765 43210",
      callerName: "Rajesh Sharma",
      timestamp: "2 mins ago",
      priority: "P0",
      status: "pending",
    },
    {
      ownerId: userKishan._id,
      shopId: kishanStore1._id,
      shopName: kishanStore1.name,
      phoneNumber: "+91 84319 80422",
      callerName: "Kishan Kumar (VIP Buyer)",
      timestamp: "5 mins ago",
      priority: "P0",
      status: "pending",
    },
    {
      ownerId: userKishan._id,
      shopId: kishanStore1._id,
      shopName: kishanStore1.name,
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

  // 2. TENANT 2: Amit Sharma (Bakery & Patisserie) - Completely Private
  const userAmit = await User.create({
    name: "Amit Sharma",
    email: "amit@involynk.com",
    passwordHash,
    phone: "+91 93539 02221",
    businessName: "Amit Bakery & Patisserie Group",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
  });

  const amitStore = await Store.create({
    ownerId: userAmit._id,
    name: "Amit Artisan Bakery & Patisserie",
    category: "Bakery & Cafe",
    phone: "+91 93539 02221",
    address: "80ft Road, 4th Block, Koramangala, Bengaluru 560034",
    operatingHours: "08:00 AM - 11:00 PM (IST)",
    bannerImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
    observedGaps: [
      "Slow menu checkout taking >5s on mobile",
      "Over 40 missed calls during weekend lunch rushes",
    ],
    aiSettings: {
      personaName: "Aarav",
      language: "en-IN",
      tone: "Urgent & Direct",
      autoWhatsApp: true,
      whatsappTemplate:
        "Hey {{name}}! Amit Bakery here. Here is our fresh menu & custom cake reservation link: {{portfolio_url}}",
      transferNumber: "+91 93539 02221",
      maxRetries: 2,
      callPacingSeconds: 10,
    },
    metrics: {
      totalMissedRecovered: 89,
      conversionRate: 52.1,
      revenueSaved: "₹92,400",
      avgLatencyMs: 310,
    },
  });

  await MissedCall.create([
    {
      ownerId: userAmit._id,
      shopId: amitStore._id,
      shopName: amitStore.name,
      phoneNumber: "+91 93539 02221",
      callerName: "Sunil Hegde (Catering Inquiry)",
      timestamp: "12 mins ago",
      priority: "P0",
      status: "pending",
    },
  ]);

  // 3. TENANT 3: Dr. Ramesh (Healthcare Dental Clinic) - Completely Private
  const userRamesh = await User.create({
    name: "Dr. Ramesh",
    email: "ramesh@involynk.com",
    passwordHash,
    phone: "+91 98450 11223",
    businessName: "Apex Dental Healthcare Network",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80",
  });

  const dentalStore = await Store.create({
    ownerId: userRamesh._id,
    name: "Apex Multispeciality Dental Clinic",
    category: "Healthcare Clinic",
    phone: "+91 98450 11223",
    address: "9th Main, 4th Block, Jayanagar, Bengaluru 560011",
    operatingHours: "09:00 AM - 08:30 PM (IST)",
    bannerImage: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80",
    observedGaps: [
      "Emergency night inquiries ringing out without voicemail triage",
      "Missing automated slot booking for toothache consultations",
    ],
    aiSettings: {
      personaName: "Dr. Tanya Assistant",
      language: "hinglish",
      tone: "Executive & Polished",
      autoWhatsApp: true,
      whatsappTemplate:
        "Namaste {{name}}, Dr. Tanya's clinic assistant here. Book today's priority dental slot: {{portfolio_url}}",
      transferNumber: "+91 98450 11223",
      maxRetries: 3,
      callPacingSeconds: 5,
    },
    metrics: {
      totalMissedRecovered: 215,
      conversionRate: 74.2,
      revenueSaved: "₹4,12,000",
      avgLatencyMs: 295,
    },
  });

  await MissedCall.create([
    {
      ownerId: userRamesh._id,
      shopId: dentalStore._id,
      shopName: dentalStore.name,
      phoneNumber: "+91 91234 56789",
      callerName: "Meera Nair (Urgent Toothache)",
      timestamp: "28 mins ago",
      priority: "P0",
      status: "pending",
    },
  ]);

  // Seed Live Call Records / "Talks" for Admin Audit & Inspection
  console.log("Seeding detailed audio & transcript talks for Super Admin inspection...");
  await CallRecord.create([
    {
      ownerId: userKishan._id,
      shopId: kishanStore1._id,
      shopName: kishanStore1.name,
      ownerName: "Kishan Kumar",
      callSid: "CA_live_7890bcf14",
      leadName: "Vikram Malhotra",
      leadPhoneNumber: "+91 98860 55441",
      phase: "CLOSE",
      sentiment: "interested",
      scoreBand: "HOT",
      durationSec: 84,
      callOutcome: "booked",
      transcript: [
        {
          speaker: "agent",
          text: "Namaste Vikram ji! Riya here calling from Kishan Dry Fruits Indiranagar. I noticed we missed your call a minute ago—how can I help with your order today?",
          timestamp: "00:03",
        },
        {
          speaker: "customer",
          text: "Haan madam, actually hume Diwali corporate gifting ke liye 200 boxes of Kashmiri walnuts aur California almonds chahiye the. Competitive rates milenge?",
          timestamp: "00:15",
          entities: ["200 boxes", "Corporate Gifting", "California Almonds"],
        },
        {
          speaker: "agent",
          text: "Bilkul Vikram ji! Hamare paas premium vacuum-sealed Kashmiri walnut kernels aur imported California almonds available hain. Custom wooden logo packaging bhi include hai.",
          timestamp: "00:27",
        },
        {
          speaker: "customer",
          text: "Achha, sample catalog aur rates WhatsApp pe bhej sakte ho abhi?",
          timestamp: "00:39",
        },
        {
          speaker: "agent",
          text: "Maine just abhi aapke WhatsApp number pe hamara festive catalog aur corporate quotation bhej diya hai! Check your phone right now.",
          timestamp: "00:46",
        },
        {
          speaker: "customer",
          text: "Haan mil gaya! Rates acche lag rahe hain. Mein Kal subah 11 baje Indiranagar store aakar advance pay karta hoon.",
          timestamp: "00:58",
        },
        {
          speaker: "agent",
          text: "Perfect Vikram ji! Maine aapka slot 11 baje book kar diya hai. See you tomorrow at Indiranagar!",
          timestamp: "01:08",
        },
      ],
      extractedEntities: {
        companyName: "Malhotra Tech Solutions",
        teamSize: "200 hampers",
        budgetSignal: "Bulk Corporate Tier (₹2.4 Lakhs)",
        timeline: "Diwali Corporate Delivery (Immediate)",
        intent: "Wholesale Gifting",
      },
      whatsAppPushed: true,
      whatsAppOpened: true,
    },
    {
      ownerId: userKishan._id,
      shopId: kishanStore2._id,
      shopName: kishanStore2.name,
      ownerName: "Kishan Kumar",
      callSid: "CA_live_4491cba92",
      leadName: "Priya Venkatesh",
      leadPhoneNumber: "+91 99001 23456",
      phase: "BOOKING",
      sentiment: "positive",
      scoreBand: "HOT",
      durationSec: 105,
      callOutcome: "booked",
      transcript: [
        {
          speaker: "agent",
          text: "Namaste Priya ji! Riya calling from Kishan Dry Fruits Jayanagar. Saw you dialed our counter—how can I help?",
          timestamp: "00:04",
        },
        {
          speaker: "customer",
          text: "Hi Riya, I wanted to order 50 bespoke dry fruit platters for a wedding reception this Sunday in Jayanagar.",
          timestamp: "00:18",
          entities: ["50 platters", "Wedding Reception"],
        },
        {
          speaker: "agent",
          text: "Congratulations on the wedding Priya ji! We specialize in royal brass and wooden wedding gift platters. I can send our bridal collection catalog on WhatsApp.",
          timestamp: "00:30",
        },
        {
          speaker: "customer",
          text: "Yes please, send it over. Can we do tasting at the store?",
          timestamp: "00:42",
        },
        {
          speaker: "agent",
          text: "Sent on WhatsApp! Yes, I have reserved a free tasting appointment for you tomorrow at 4 PM at our 4th Block Jayanagar outlet.",
          timestamp: "00:55",
        },
      ],
      extractedEntities: {
        companyName: "Venkatesh Wedding",
        teamSize: "50 Platters",
        budgetSignal: "Premium Gourmet (₹75,000)",
        timeline: "This Sunday",
        intent: "Wedding Gifting",
      },
      whatsAppPushed: true,
      whatsAppOpened: true,
    },
    {
      ownerId: userAmit._id,
      shopId: amitStore._id,
      shopName: amitStore.name,
      ownerName: "Amit Sharma",
      callSid: "CA_live_81920dfa1",
      leadName: "Sunil Hegde",
      leadPhoneNumber: "+91 93539 02221",
      phase: "PITCH",
      sentiment: "curious",
      scoreBand: "WARM",
      durationSec: 72,
      callOutcome: "follow_up",
      transcript: [
        {
          speaker: "agent",
          text: "Hey Sunil! Aarav calling from Amit Artisan Bakery Koramangala. Noticed we missed your ring—calling you right back!",
          timestamp: "00:03",
        },
        {
          speaker: "customer",
          text: "Hey! Do you do customized 3-tier Belgian Chocolate cakes for a corporate milestone party for 80 people?",
          timestamp: "00:16",
        },
        {
          speaker: "agent",
          text: "Yes Sunil! Our master pastry chef crafts Belgian chocolate truffle cakes with custom edible logo printing. We deliver chilled across Koramangala.",
          timestamp: "00:29",
        },
        {
          speaker: "customer",
          text: "Great! WhatsApp me the flavor combinations and pricing per kg.",
          timestamp: "00:40",
        },
        {
          speaker: "agent",
          text: "Just sent our specialty artisan menu and pricing tier to your WhatsApp right now!",
          timestamp: "00:48",
        },
      ],
      extractedEntities: {
        companyName: "Hegde Media Lab",
        teamSize: "80 guests",
        budgetSignal: "Standard Milestone Budget (₹18,000)",
        timeline: "Friday Evening",
        intent: "Custom Bakery Order",
      },
      whatsAppPushed: true,
      whatsAppOpened: true,
    },
    {
      ownerId: userRamesh._id,
      shopId: dentalStore._id,
      shopName: dentalStore.name,
      ownerName: "Dr. Ramesh",
      callSid: "CA_live_99210eab5",
      leadName: "Meera Nair",
      leadPhoneNumber: "+91 91234 56789",
      phase: "CONFIRMATION",
      sentiment: "positive",
      scoreBand: "HOT",
      durationSec: 130,
      callOutcome: "booked",
      transcript: [
        {
          speaker: "agent",
          text: "Namaste Meera ji, Dr. Tanya's assistant here from Apex Dental Clinic. We noticed your call went unanswered—are you experiencing an emergency?",
          timestamp: "00:04",
        },
        {
          speaker: "customer",
          text: "Yes, I have severe molar toothache since last night. Is Dr. Ramesh available for a quick consultation today?",
          timestamp: "00:17",
        },
        {
          speaker: "agent",
          text: "I completely understand the pain Meera ji. We have an emergency slot open with Dr. Ramesh at 5:30 PM today at our Jayanagar branch. Should I reserve it?",
          timestamp: "00:32",
        },
        {
          speaker: "customer",
          text: "Yes please, book 5:30 PM. What should I bring?",
          timestamp: "00:44",
        },
        {
          speaker: "agent",
          text: "Your appointment is confirmed for 5:30 PM. I've sent the clinic location map and medical history questionnaire on your WhatsApp.",
          timestamp: "00:56",
        },
      ],
      extractedEntities: {
        companyName: "Patient Emergency",
        teamSize: "1 Patient",
        budgetSignal: "Insurance / Consultation",
        timeline: "Today 5:30 PM (Urgent)",
        intent: "Emergency Dental Consultation",
      },
      whatsAppPushed: true,
      whatsAppOpened: true,
    },
    {
      ownerId: userKishan._id,
      shopId: kishanStore1._id,
      shopName: kishanStore1.name,
      ownerName: "Kishan Kumar",
      callSid: "CA_live_12344fee0",
      leadName: "Rohan Singhania",
      leadPhoneNumber: "+91 98440 88771",
      phase: "ESCALATION",
      sentiment: "skeptical",
      scoreBand: "HOT",
      durationSec: 64,
      callOutcome: "escalated",
      transcript: [
        {
          speaker: "agent",
          text: "Namaste Rohan ji! Riya here from Kishan Dry Fruits Indiranagar. How can I help with your order?",
          timestamp: "00:03",
        },
        {
          speaker: "customer",
          text: "Look, I need to place an order for 2,000 corporate gift hampers for our pan-India tech firm. I need to speak directly to the founder or senior director right now.",
          timestamp: "00:15",
          entities: ["2,000 hampers", "Pan-India"],
        },
        {
          speaker: "agent",
          text: "Understood Rohan ji. For an enterprise bulk order of 2,000 hampers, I am transferring you directly to our Managing Director's personal line right away. Please hold.",
          timestamp: "00:28",
        },
      ],
      extractedEntities: {
        companyName: "Singhania Enterprise Systems",
        teamSize: "2,000 hampers",
        budgetSignal: "High-Ticket VIP (₹15 Lakhs+)",
        timeline: "Diwali Corporate Distribution",
        intent: "Executive Manager Escalation",
      },
      whatsAppPushed: false,
      whatsAppOpened: false,
    },
  ]);

  console.log("\n========================================================");
  console.log("🎉 Live MongoDB Atlas Seeding Complete!");
  console.log("========================================================");
  console.log("3 Completely Isolated Tenants Created (Zero cross-leakage):");
  console.log("1. kishan@involynk.com / password123 -> Kishan Dry Fruits (2 stores)");
  console.log("2. amit@involynk.com   / password123 -> Amit Artisan Bakery (1 store)");
  console.log("3. ramesh@involynk.com / password123 -> Apex Dental Clinic (1 store)");
  console.log("========================================================\n");

  await mongoose.disconnect();
  console.log("Disconnected cleanly.");
}

seedDatabase().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});

