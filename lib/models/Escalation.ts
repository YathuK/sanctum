import mongoose, { Schema, models, model } from "mongoose";

export interface IEscalation {
  _id: mongoose.Types.ObjectId;
  transactionId?: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  requestedAmount: number;
  vendor: string;
  category: string;
  reason: string;
  currency: string;
  status: "pending" | "approved" | "denied";
  respondedAt?: Date;
  createdAt: Date;
}

const EscalationSchema = new Schema<IEscalation>({
  transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
  agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  requestedAmount: { type: Number, required: true },
  vendor: { type: String, required: true },
  category: { type: String, required: true },
  reason: { type: String, default: "" },
  currency: { type: String, default: "CAD" },
  status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" },
  respondedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export const Escalation = models.Escalation || model<IEscalation>("Escalation", EscalationSchema);
