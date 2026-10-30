import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICallRecord extends Document {
  ownerId: Types.ObjectId;
  shopId: Types.ObjectId;
  shopName: string;
  ownerName: string;
  callSid: string;
  leadName: string;
  leadPhoneNumber: string;
  phase: string;
  sentiment: string;
  scoreBand: string;
  durationSec: number;
  callOutcome: "booked" | "follow_up" | "not_interested" | "escalated";
  transcript: Array<{
    speaker: "agent" | "customer";
    text: string;
    timestamp: string;
    entities?: string[];
  }>;
  extractedEntities: {
    companyName?: string;
    teamSize?: string;
    budgetSignal?: string;
    timeline?: string;
    intent?: string;
  };
  callNotes?: string;
  actionItems?: string[];
  objectionsRaised?: string[];
  twilioDetails?: {
    fromNumber?: string;
    status?: string;
    recordingUrl?: string;
  };
  whatsAppPushed: boolean;
  whatsAppOpened: boolean;
  createdAt: Date;
}

const CallRecordSchema = new Schema<ICallRecord>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    shopId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    shopName: { type: String, required: true, index: true },
    ownerName: { type: String, default: "Store Owner" },
    callSid: { type: String, required: true, index: true },
    leadName: { type: String, required: true },
    leadPhoneNumber: { type: String, required: true },
    phase: { type: String, default: "CLOSE" },
    sentiment: { type: String, default: "curious" },
    scoreBand: { type: String, default: "WARM" },
    durationSec: { type: Number, default: 0 },
    callOutcome: { 
      type: String, 
      enum: ["booked", "follow_up", "not_interested", "escalated"], 
      default: "booked" 
    },
    transcript: [
      {
        speaker: { type: String, enum: ["agent", "customer"] },
        text: { type: String },
        timestamp: { type: String },
        entities: [{ type: String }],
      },
    ],
    extractedEntities: {
      companyName: { type: String },
      teamSize: { type: String },
      budgetSignal: { type: String },
      timeline: { type: String },
      intent: { type: String },
    },
    callNotes: { type: String, default: "" },
    actionItems: [{ type: String }],
    objectionsRaised: [{ type: String }],
    twilioDetails: {
      fromNumber: { type: String },
      status: { type: String },
      recordingUrl: { type: String },
    },
    whatsAppPushed: { type: Boolean, default: false },
    whatsAppOpened: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const CallRecord = mongoose.models.CallRecord || mongoose.model<ICallRecord>("CallRecord", CallRecordSchema);

