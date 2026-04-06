import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { WebhookEvent } from "@/lib/models/Webhook";
import mongoose from "mongoose";

export type WebhookEventType =
  | "transaction.approved"
  | "transaction.blocked"
  | "transaction.reversed"
  | "escalation.created"
  | "escalation.approved"
  | "escalation.denied"
  | "agent.created"
  | "agent.suspended";

export async function emitWebhook(
  userId: mongoose.Types.ObjectId | string,
  type: WebhookEventType,
  payload: any
) {
  try {
    await connectDB();
    const user = await User.findById(userId);
    if (!user?.webhookUrl) return;

    const event = await WebhookEvent.create({
      userId,
      type,
      payload,
      webhookUrl: user.webhookUrl,
    });

    // Fire-and-forget delivery
    deliverWebhook(event._id.toString()).catch(() => {});
  } catch {
    // Don't fail the main operation if webhook emission fails
  }
}

async function deliverWebhook(eventId: string) {
  await connectDB();
  const event = await WebhookEvent.findById(eventId);
  if (!event || event.status === "delivered") return;

  try {
    const res = await fetch(event.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sanctum-Event": event.type,
        "X-Sanctum-Event-ID": event._id.toString(),
      },
      body: JSON.stringify({
        id: event._id.toString(),
        type: event.type,
        payload: event.payload,
        createdAt: event.createdAt.toISOString(),
      }),
      signal: AbortSignal.timeout(10000),
    });

    event.attempts += 1;

    if (res.ok) {
      event.status = "delivered";
      event.deliveredAt = new Date();
    } else {
      event.lastError = `HTTP ${res.status}`;
      if (event.attempts >= 3) event.status = "failed";
    }
  } catch (err: any) {
    event.attempts += 1;
    event.lastError = err.message;
    if (event.attempts >= 3) event.status = "failed";
  }

  await event.save();
}
