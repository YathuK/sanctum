import mongoose from "mongoose";

export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;
}

export function sanitizeString(str: unknown, maxLength = 500): string {
  if (typeof str !== "string") return "";
  // Strip null bytes and control characters
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, maxLength);
}

export function sanitizeNumber(val: unknown): number {
  const num = Number(val);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num);
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function isValidHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const VALID_CATEGORIES = ["software", "travel", "procurement", "marketing", "other"];

export function isValidCategory(category: string): boolean {
  return VALID_CATEGORIES.includes(category);
}

const VALID_STATUSES = ["approved", "blocked", "pending_approval", "reversed"];

export function isValidTransactionStatus(status: string): boolean {
  return VALID_STATUSES.includes(status);
}

/**
 * Sanitize and limit arrays to prevent memory exhaustion attacks.
 */
export function sanitizeStringArray(arr: unknown, maxItems = 50, maxItemLength = 200): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((item): item is string => typeof item === "string")
    .slice(0, maxItems)
    .map((item) => sanitizeString(item, maxItemLength));
}

/**
 * Validate expiry date — must be in future but not more than 1 year out.
 */
export function isValidExpiryDate(date: Date): boolean {
  const now = new Date();
  const maxExpiry = new Date();
  maxExpiry.setFullYear(maxExpiry.getFullYear() + 1);
  return date > now && date <= maxExpiry;
}
