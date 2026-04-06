import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { WebhookEvent } from "@/lib/models/Webhook";
import { signWebhookPayload } from "@/lib/apiSecurity";
import { logError, logInfo } from "@/lib/logger";
import mongoose from "mongoose";
import crypto from "crypto";

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

    // Enforce HTTPS for webhook URLs
    if (!user.webhookUrl.startsWith("https://")) {
      logInfo("webhook", `Skipping non-HTTPS webhook for user ${userId}`);
      return;
    }

    const event = await WebhookEvent.create({
      userId,
      type,
      payload: sanitizePayload(payload),
      webhookUrl: user.webhookUrl,
    });

    // Fire-and-forget delivery
    deliverWebhook(event._id.toString()).catch(() => {});
  } catch {
    // Don't fail the main operation if webhook emission fails
  }
}

/**
 * Strip any sensitive fields from webhook payloads.
 */
function sanitizePayload(payload: any): any {
  if (!payload || typeof payload !== "object") return payload;
  const clean = { ...payload };
  delete clean.token;
  delete clean.agentToken;
  delete clean.secret;
  return clean;
}

async function deliverWebhook(eventId: string) {
  await connectDB();
  const event = await WebhookEvent.findById(eventId);
  if (!event || event.status === "delivered") return;

  const body = JSON.stringify({
    id: event._id.toString(),
    type: event.type,
    payload: event.payload,
    createdAt: event.createdAt.toISOString(),
  });

  // Sign the payload with HMAC-SHA256
  const webhookSecret = process.env.JWT_SECRET || "sanctum-webhook";
  const signature = signWebhookPayload(body, webhookSecret);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(event.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sanctum-Event": event.type,
        "X-Sanctum-Event-ID": event._id.toString(),
        "X-Sanctum-Signature": `sha256=${signature}`,
        "X-Sanctum-Timestamp": timestamp,
        "User-Agent": "Sanctum-Webhook/1.0",
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    event.attempts += 1;

    if (res.ok) {
      event.status = "delivered";
      event.deliveredAt = new Date();
      logInfo("webhook", `Delivered ${event.type} to ${event.webhookUrl}`);
    } else {
      event.lastError = `HTTP ${res.status}`;
      if (event.attempts >= 3) event.status = "failed";
    }
  } catch (err: any) {
    event.attempts += 1;
    event.lastError = err.name === "AbortError" ? "Timeout" : "Connection failed";
    if (event.attempts >= 3) event.status = "failed";
  }

  await event.save();
}
