import mongoose, { Schema, models, model } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  company: string;
  plan: "developer" | "team" | "enterprise";
  webhookUrl?: string;
  emailNotifications: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  company: { type: String, default: "" },
  plan: { type: String, enum: ["developer", "team", "enterprise"], default: "developer" },
  webhookUrl: { type: String, default: "" },
  emailNotifications: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = models.User || model<IUser>("User", UserSchema);
