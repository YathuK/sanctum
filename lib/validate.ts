import mongoose from "mongoose";

export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;
}

export function sanitizeString(str: unknown, maxLength = 500): string {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLength);
}

export function sanitizeNumber(val: unknown): number {
  const num = Number(val);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
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
