"""Sanctum Python client."""

from __future__ import annotations

import json
from typing import Any, Literal, Optional
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError


class SanctumError(Exception):
    """Raised when a Sanctum API call fails."""

    def __init__(self, message: str, status: int = 0, code: str = "UNKNOWN"):
        super().__init__(message)
        self.status = status
        self.code = code


class Sanctum:
    """
    Sanctum SDK client for AI agent transaction authorization.

    Args:
        agent_token: JWT agent token from the Sanctum dashboard.
        base_url: API base URL (default: https://sanctum-tawny.vercel.app).
        sandbox: Enable sandbox/test mode (default: False).
        timeout: Request timeout in seconds (default: 30).
    """

    def __init__(
        self,
        agent_token: str,
        base_url: str = "https://sanctum-tawny.vercel.app",
        sandbox: bool = False,
        timeout: int = 30,
    ):
        if not agent_token:
            raise SanctumError("agent_token is required", 400, "MISSING_TOKEN")

        self.agent_token = agent_token
        self.base_url = base_url.rstrip("/")
        self.sandbox = sandbox
        self.timeout = timeout

    def authorize(
        self,
        vendor: str,
        amount: int,
        category: Literal["software", "travel", "procurement", "marketing", "other"],
        reasoning: str,
        currency: str = "CAD",
    ) -> dict[str, Any]:
        """
        Request authorization for a transaction.

        Args:
            vendor: The vendor/merchant name.
            amount: Amount in cents (e.g., 4999 = $49.99).
            category: Spending category.
            reasoning: Why the agent wants to make this purchase.
            currency: Currency code (default: CAD).

        Returns:
            Dict with 'status' ('approved', 'blocked', or 'pending_approval')
            and additional fields like transactionId, reason, claudeAnalysis.

        Raises:
            SanctumError: If the request fails.
        """
        payload = {
            "agentToken": self.agent_token,
            "vendor": vendor,
            "amount": amount,
            "currency": currency,
            "category": category,
            "reasoning": reasoning,
            "sandbox": self.sandbox,
        }

        return self._post("/api/authorize", payload)

    def check(
        self,
        vendor: str,
        amount: int,
        category: Literal["software", "travel", "procurement", "marketing", "other"],
        reasoning: str,
        currency: str = "CAD",
    ) -> dict[str, Any]:
        """Pre-flight check without creating a real transaction."""
        return self.authorize(
            vendor=vendor,
            amount=amount,
            category=category,
            reasoning=f"[DRY_RUN] {reasoning}",
            currency=currency,
        )

    def _post(self, path: str, payload: dict) -> dict[str, Any]:
        url = f"{self.base_url}{path}"
        data = json.dumps(payload).encode("utf-8")
        req = Request(url, data=data, headers={"Content-Type": "application/json"})

        try:
            with urlopen(req, timeout=self.timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except HTTPError as e:
            body = json.loads(e.read().decode("utf-8")) if e.readable() else {}
            raise SanctumError(
                body.get("error", str(e)),
                e.code,
                body.get("code", "HTTP_ERROR"),
            )
        except URLError as e:
            raise SanctumError(str(e.reason), 0, "NETWORK_ERROR")
