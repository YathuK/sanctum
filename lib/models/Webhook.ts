import mongoose, { Schema, models, model } from "mongoose";

export interface IWebhookEvent {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: string;
  payload: any;
  webhookUrl: string;
  status: "pending" | "delivered" | "failed";
  attempts: number;
  lastError?: string;
  deliveredAt?: Date;
  createdAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, required: true, index: true },
  payload: { type: Schema.Types.Mixed, required: true },
  webhookUrl: { type: String, required: true },
  status: { type: String, enum: ["pending", "delivered", "failed"], default: "pending", index: true },
  attempts: { type: Number, default: 0 },
  lastError: { type: String },
  deliveredAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

WebhookEventSchema.index({ userId: 1, createdAt: -1 });

export const WebhookEvent = models.WebhookEvent || model<IWebhookEvent>("WebhookEvent", WebhookEventSchema);
