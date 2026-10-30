import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  businessName: string;
  avatar: string;
  role: "business_owner" | "super_admin";
  createdAt: Date;
  comparePassword: (password: string) => Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, required: true },
    businessName: { type: String, required: true },
    role: { type: String, enum: ["business_owner", "super_admin"], default: "business_owner" },
    avatar: { 
      type: String, 
      default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" 
    },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

