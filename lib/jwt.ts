import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET!;
const ALGORITHM = "HS256";

export interface AgentTokenPayload {
  agentId: string;
  userId: string;
  jti: string; // Unique token ID for revocation
  policy: {
    maxPerTransaction: number;
    maxPerDay: number;
    approvedCategories: string[];
    blockedVendors: string[];
    requiresApprovalAbove: number;
    currency: string;
  };
}

// In-memory revocation list (use Redis in production at scale)
const revokedTokens = new Set<string>();
const revocationExpiry = new Map<string, number>();

export function signAgentToken(
  payload: Omit<AgentTokenPayload, "jti">,
  expiresAt: Date
): string {
  const expiresIn = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
  if (expiresIn <= 0) throw new Error("Token expiry must be in the future");

  const jti = crypto.randomUUID();
  return jwt.sign({ ...payload, jti }, JWT_SECRET, {
    algorithm: ALGORITHM,
    expiresIn,
  });
}

export function verifyAgentToken(token: string): AgentTokenPayload {
  const payload = jwt.verify(token, JWT_SECRET, {
    algorithms: [ALGORITHM],
    complete: false,
  }) as AgentTokenPayload;

  // Check revocation list
  if (payload.jti && revokedTokens.has(payload.jti)) {
    throw new Error("Token has been revoked");
  }

  return payload;
}

export function revokeToken(jti: string, expiresAt?: Date): void {
  revokedTokens.add(jti);
  // Auto-cleanup after token would have expired anyway
  const ttl = expiresAt ? expiresAt.getTime() : Date.now() + 30 * 24 * 60 * 60 * 1000;
  revocationExpiry.set(jti, ttl);

  // Cleanup expired revocations periodically
  if (revokedTokens.size > 1000) {
    const now = Date.now();
    for (const [id, exp] of revocationExpiry) {
      if (now > exp) {
        revokedTokens.delete(id);
        revocationExpiry.delete(id);
      }
    }
  }
}

// Constant-time string comparison for security-sensitive checks
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
