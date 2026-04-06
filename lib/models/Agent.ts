import mongoose, { Schema, models, model } from "mongoose";

export interface IAgent {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  token: string;
  status: "active" | "suspended" | "expired";
  policy: {
    maxPerTransaction: number;
    maxPerDay: number;
    approvedCategories: string[];
    blockedVendors: string[];
    requiresApprovalAbove: number;
    currency: string;
  };
  spentToday: number;
  lastResetDate: string;
  createdAt: Date;
  expiresAt: Date;
}

const AgentSchema = new Schema<IAgent>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  token: { type: String, required: true },
  status: { type: String, enum: ["active", "suspended", "expired"], default: "active", index: true },
  policy: {
    maxPerTransaction: { type: Number, required: true },
    maxPerDay: { type: Number, required: true },
    approvedCategories: [{ type: String }],
    blockedVendors: [{ type: String }],
    requiresApprovalAbove: { type: Number, default: 100000 },
    currency: { type: String, default: "CAD" },
  },
  spentToday: { type: Number, default: 0 },
  lastResetDate: { type: String, default: () => new Date().toISOString().split("T")[0] },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

AgentSchema.index({ userId: 1, status: 1 });

export const Agent = models.Agent || model<IAgent>("Agent", AgentSchema);
