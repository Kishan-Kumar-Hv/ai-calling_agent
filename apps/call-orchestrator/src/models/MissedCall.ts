import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMissedCall extends Document {
  ownerId: Types.ObjectId;
  shopId: Types.ObjectId;
  shopName: string;
  phoneNumber: string;
  callerName: string;
  timestamp: string;
  priority: "P0" | "P1" | "P2";
  status: "pending" | "dialing" | "completed" | "failed" | "cooldown_blocked";
  lastCallAttempt?: string;
  cooldownUntil?: string;
  duration?: string;
  outcome?: "booked" | "follow_up" | "not_interested" | "escalated";
  scoreBand?: "HOT" | "WARM" | "COLD" | "UNSCORED";
  callNotes?: string;
  actionItems?: string[];
  callCount?: number;
  priorityReason?: string;
  priorityScore?: number;
  queueRank?: number;
  whatsAppAckSent?: boolean;
  tieBreakWinner?: boolean;
  createdAt: Date;
}

const MissedCallSchema = new Schema<IMissedCall>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    shopId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    shopName: { type: String, required: true },
    phoneNumber: { type: String, required: true, index: true },
    callerName: { type: String, default: "Inbound Lead" },
    timestamp: { type: String, default: "Just now" },
    priority: { type: String, enum: ["P0", "P1", "P2"], default: "P0" },
    status: {
      type: String,
      enum: ["pending", "dialing", "completed", "failed", "cooldown_blocked"],
      default: "pending",
    },
    lastCallAttempt: { type: String },
    cooldownUntil: { type: String },
    duration: { type: String },
    outcome: { type: String, enum: ["booked", "follow_up", "not_interested", "escalated"] },
    scoreBand: { type: String, enum: ["HOT", "WARM", "COLD", "UNSCORED"], default: "UNSCORED" },
    callNotes: { type: String, default: "" },
    actionItems: [{ type: String }],
    callCount: { type: Number, default: 1 },
    priorityReason: { type: String, default: "Fresh Missed Call (<2m)" },
    priorityScore: { type: Number, default: 100 },
    queueRank: { type: Number, default: 1 },
    whatsAppAckSent: { type: Boolean, default: false },
    tieBreakWinner: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const MissedCall = mongoose.models.MissedCall || mongoose.model<IMissedCall>("MissedCall", MissedCallSchema);

