import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStore extends Document {
  ownerId: Types.ObjectId;
  name: string;
  category: string;
  phone: string;
  address: string;
  operatingHours: string;
  bannerImage: string;
  observedGaps: string[];
  aiSettings: {
    personaName: string;
    language: string;
    tone: string;
    autoWhatsApp: boolean;
    whatsappTemplate: string;
    transferNumber: string;
    maxRetries: number;
    callPacingSeconds: number;
  };
  twilioConfig?: {
    phoneNumber?: string;
    accountSid?: string;
    authToken?: string;
    enabled?: boolean;
  };
  metrics: {
    totalMissedRecovered: number;
    conversionRate: number;
    revenueSaved: string;
    avgLatencyMs: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, default: "Retail" },
    phone: { type: String, required: true },
    address: { type: String, default: "Bangalore, India" },
    operatingHours: { type: String, default: "09:30 AM - 09:30 PM (IST)" },
    bannerImage: {
      type: String,
      default: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    },
    observedGaps: [{ type: String }],
    aiSettings: {
      personaName: { type: String, default: "Riya" },
      language: { type: String, default: "hinglish" },
      tone: { type: String, default: "Friendly & Empathetic" },
      autoWhatsApp: { type: Boolean, default: true },
      whatsappTemplate: {
        type: String,
        default: "Hi {{name}}! Calling from {{shop_name}}. Sorry we missed your ring. Here is our direct WhatsApp catalog: {{portfolio_url}}",
      },
      transferNumber: { type: String, default: "+91 84319 80422" },
      maxRetries: { type: Number, default: 3 },
      callPacingSeconds: { type: Number, default: 8 },
    },
    twilioConfig: {
      phoneNumber: { type: String, default: "" },
      accountSid: { type: String, default: "" },
      authToken: { type: String, default: "" },
      enabled: { type: Boolean, default: false },
    },
    metrics: {
      totalMissedRecovered: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
      revenueSaved: { type: String, default: "₹0" },
      avgLatencyMs: { type: Number, default: 310 },
    },
  },
  { timestamps: true }
);

export const Store = mongoose.models.Store || mongoose.model<IStore>("Store", StoreSchema);

