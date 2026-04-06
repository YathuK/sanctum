import mongoose, { Schema, models, model } from "mongoose";

export interface ITransaction {
  _id: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  vendor: string;
  amount: number;
  currency: string;
  category: string;
  agentReasoning: string;
  claudeAnalysis?: string;
  status: "approved" | "blocked" | "pending_approval" | "reversed";
  policyRuleApplied?: string;
  humanApprovedBy?: string;
  humanApprovedAt?: Date;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  vendor: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "CAD" },
  category: { type: String, required: true },
  agentReasoning: { type: String, default: "" },
  claudeAnalysis: { type: String, default: "" },
  status: {
    type: String,
    enum: ["approved", "blocked", "pending_approval", "reversed"],
    required: true,
    index: true,
  },
  policyRuleApplied: { type: String, default: "" },
  humanApprovedBy: { type: String },
  humanApprovedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ userId: 1, status: 1, createdAt: -1 });
TransactionSchema.index({ agentId: 1, createdAt: -1 });

export const Transaction = models.Transaction || model<ITransaction>("Transaction", TransactionSchema);
