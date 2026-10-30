import mongoose, { Schema, Document, Types } from "mongoose";

export interface IProduct extends Document {
  ownerId: Types.ObjectId;
  shopId: Types.ObjectId;
  name: string;
  description: string;
  category: string;
  priceRetail: number;
  priceWholesale?: number;
  unit: string;              // "kg", "box", "piece", "dozen", "pack"
  minOrderQty: number;
  maxOrderQty?: number;
  stockStatus: "in_stock" | "limited" | "out_of_stock";
  stockQty?: number;
  tags: string[];            // ["festive", "bulk", "gifting", "premium"]
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    ownerId:       { type: Schema.Types.ObjectId, ref: "User",  required: true, index: true },
    shopId:        { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    name:          { type: String, required: true },
    description:   { type: String, default: "" },
    category:      { type: String, default: "General" },
    priceRetail:   { type: Number, required: true },
    priceWholesale:{ type: Number },
    unit:          { type: String, default: "piece" },
    minOrderQty:   { type: Number, default: 1 },
    maxOrderQty:   { type: Number },
    stockStatus:   { type: String, enum: ["in_stock", "limited", "out_of_stock"], default: "in_stock" },
    stockQty:      { type: Number },
    tags:          [{ type: String }],
    imageUrl:      { type: String },
    isActive:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound index so catalog lookup by shopId is blazing fast
ProductSchema.index({ shopId: 1, isActive: 1 });

export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
