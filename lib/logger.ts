/**
 * Secure logger that redacts sensitive fields from error output.
 * Never logs tokens, passwords, secrets, or PII.
 */

const REDACTED_FIELDS = new Set([
  "token", "agentToken", "password", "secret", "apiKey", "authorization",
  "cookie", "session", "pass", "key", "email", "creditCard",
  "MONGODB_URI", "JWT_SECRET", "STRIPE_SECRET_KEY", "ANTHROPIC_API_KEY",
  "NEXTAUTH_SECRET", "RESEND_API_KEY",
]);

function redactObject(obj: any, depth = 0): any {
  if (depth > 5) return "[MAX_DEPTH]";
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return obj.length > 200 ? obj.slice(0, 50) + "...[TRUNCATED]" : obj;
  if (typeof obj !== "object") return obj;

  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      // Don't log stack traces in production
      ...(process.env.NODE_ENV === "development" ? { stack: obj.stack } : {}),
    };
  }

  if (Array.isArray(obj)) {
    return obj.slice(0, 10).map((item) => redactObject(item, depth + 1));
  }

  const redacted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (REDACTED_FIELDS.has(key) || REDACTED_FIELDS.has(key.toLowerCase())) {
      redacted[key] = "[REDACTED]";
    } else if (typeof value === "string" && value.length > 100 && /^ey[A-Za-z0-9]/.test(value)) {
      redacted[key] = "[REDACTED_JWT]";
    } else {
      redacted[key] = redactObject(value, depth + 1);
    }
  }
  return redacted;
}

export function logError(context: string, err: unknown): void {
  const safe = redactObject(err);
  console.error(`[SANCTUM:${context}]`, JSON.stringify(safe));
}

export function logWarn(context: string, message: string, meta?: any): void {
  const safe = meta ? redactObject(meta) : undefined;
  console.warn(`[SANCTUM:${context}] ${message}`, safe ? JSON.stringify(safe) : "");
}

export function logInfo(context: string, message: string): void {
  console.log(`[SANCTUM:${context}] ${message}`);
}
