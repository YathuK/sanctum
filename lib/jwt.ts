import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AgentTokenPayload {
  agentId: string;
  userId: string;
  policy: {
    maxPerTransaction: number;
    maxPerDay: number;
    approvedCategories: string[];
    blockedVendors: string[];
    requiresApprovalAbove: number;
    currency: string;
  };
}

export function signAgentToken(
  payload: AgentTokenPayload,
  expiresAt: Date
): string {
  const expiresIn = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyAgentToken(token: string): AgentTokenPayload {
  return jwt.verify(token, JWT_SECRET) as AgentTokenPayload;
}
