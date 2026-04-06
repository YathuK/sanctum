/**
 * Sanctum Node.js SDK
 * The trust and authorization layer for AI agent commerce.
 *
 * @example
 * ```typescript
 * import { Sanctum } from '@sanctum-ai/sdk';
 *
 * const sanctum = new Sanctum({ agentToken: 'your-token' });
 * const result = await sanctum.authorize({
 *   vendor: 'AWS',
 *   amount: 4999,
 *   category: 'software',
 *   reasoning: 'CI/CD pipeline compute',
 * });
 *
 * if (result.status === 'approved') {
 *   // proceed with purchase
 * }
 * ```
 */

export interface SanctumConfig {
  /** Agent JWT token from the Sanctum dashboard */
  agentToken: string;
  /** Base URL (default: https://sanctum-tawny.vercel.app) */
  baseUrl?: string;
  /** Enable sandbox mode for testing (default: false) */
  sandbox?: boolean;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
}

export interface AuthorizeRequest {
  vendor: string;
  amount: number;
  currency?: "CAD" | "USD";
  category: "software" | "travel" | "procurement" | "marketing" | "other";
  reasoning: string;
}

export interface AuthorizeResponse {
  status: "approved" | "blocked" | "pending_approval";
  transactionId?: string;
  escalationId?: string;
  reason?: string;
  policyRuleApplied?: string;
  claudeAnalysis?: string;
}

export class SanctumError extends Error {
  public status: number;
  public code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "SanctumError";
    this.status = status;
    this.code = code;
  }
}

export class Sanctum {
  private config: Required<SanctumConfig>;

  constructor(config: SanctumConfig) {
    if (!config.agentToken) {
      throw new SanctumError("agentToken is required", 400, "MISSING_TOKEN");
    }

    this.config = {
      agentToken: config.agentToken,
      baseUrl: config.baseUrl || "https://sanctum-tawny.vercel.app",
      sandbox: config.sandbox || false,
      timeout: config.timeout || 30000,
    };
  }

  /**
   * Request authorization for a transaction.
   * Returns approved, blocked, or pending_approval.
   */
  async authorize(request: AuthorizeRequest): Promise<AuthorizeResponse> {
    const url = `${this.config.baseUrl}/api/authorize`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentToken: this.config.agentToken,
          vendor: request.vendor,
          amount: request.amount,
          currency: request.currency || "CAD",
          category: request.category,
          reasoning: request.reasoning,
          sandbox: this.config.sandbox,
        }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (res.status >= 500) {
        throw new SanctumError(data.error || "Server error", res.status, "SERVER_ERROR");
      }

      return data as AuthorizeResponse;
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new SanctumError("Request timed out", 408, "TIMEOUT");
      }
      if (err instanceof SanctumError) throw err;
      throw new SanctumError(err.message, 0, "NETWORK_ERROR");
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check if a transaction would be approved without actually creating it.
   * Useful for pre-flight checks in agent workflows.
   */
  async check(request: AuthorizeRequest): Promise<AuthorizeResponse> {
    return this.authorize({ ...request, reasoning: `[DRY_RUN] ${request.reasoning}` });
  }
}

export default Sanctum;
