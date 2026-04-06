import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rateLimit";

/**
 * Validate that POST/PATCH requests have correct Content-Type.
 */
export function validateContentType(req: NextRequest): NextResponse | null {
  if (["POST", "PATCH", "PUT"].includes(req.method)) {
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 415 }
      );
    }
  }
  return null;
}

/**
 * Apply rate limiting to any route.
 */
export function applyRateLimit(
  key: string,
  plan: string = "developer"
): NextResponse | null {
  const result = checkRateLimit(key, plan);
  if (!result.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: rateLimitHeaders(result, plan) }
    );
  }
  return null;
}

/**
 * Generate HMAC signature for webhook payloads.
 */
export function signWebhookPayload(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");
}

/**
 * Sanitize error for client response — never leak internals.
 */
export function safeErrorResponse(status: number = 500) {
  const messages: Record<number, string> = {
    400: "Bad request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not found",
    409: "Conflict",
    415: "Unsupported media type",
    429: "Rate limit exceeded",
    500: "Internal server error",
    503: "Service unavailable",
  };
  return NextResponse.json(
    { error: messages[status] || "Internal server error" },
    { status }
  );
}

/**
 * CORS headers for API routes.
 */
export function corsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigins = [
    "https://sanctum-tawny.vercel.app",
    process.env.NEXTAUTH_URL,
  ].filter(Boolean) as string[];

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Sanctum-API-Key",
    "Access-Control-Max-Age": "86400",
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}
