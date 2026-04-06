"""
Sanctum + LangChain Integration

Use Sanctum as an authorization layer for LangChain tool calls
that involve spending money.

Usage:
    from sanctum_langchain import SanctumAuthorizedTool

    # Wrap any LangChain tool with Sanctum authorization
    tool = SanctumAuthorizedTool(
        tool=your_purchase_tool,
        sanctum_token="your-agent-token",
        category="software",
    )
"""

from __future__ import annotations

import json
from typing import Any, Optional
from urllib.request import Request, urlopen


class SanctumGate:
    """
    Authorization gate for LangChain agents.
    Call .authorize() before executing any purchase action.
    """

    def __init__(
        self,
        agent_token: str,
        base_url: str = "https://sanctum-tawny.vercel.app",
        default_category: str = "software",
    ):
        self.agent_token = agent_token
        self.base_url = base_url.rstrip("/")
        self.default_category = default_category

    def authorize(
        self,
        vendor: str,
        amount: int,
        reasoning: str,
        category: Optional[str] = None,
        currency: str = "CAD",
    ) -> dict[str, Any]:
        """
        Request authorization before making a purchase.

        Args:
            vendor: Vendor/merchant name
            amount: Amount in cents
            reasoning: Why the agent needs this purchase
            category: Spending category (default: self.default_category)
            currency: CAD or USD

        Returns:
            Authorization result dict with 'status' key.

        Example in a LangChain agent:
            gate = SanctumGate(agent_token="...")

            @tool
            def purchase_saas(vendor: str, amount: int, reason: str) -> str:
                auth = gate.authorize(vendor=vendor, amount=amount, reasoning=reason)
                if auth["status"] != "approved":
                    return f"Purchase blocked: {auth.get('reason', 'Policy violation')}"
                # ... execute purchase ...
                return f"Purchased from {vendor} for ${amount/100:.2f}"
        """
        payload = {
            "agentToken": self.agent_token,
            "vendor": vendor,
            "amount": amount,
            "currency": currency,
            "category": category or self.default_category,
            "reasoning": reasoning,
        }

        data = json.dumps(payload).encode("utf-8")
        req = Request(
            f"{self.base_url}/api/authorize",
            data=data,
            headers={"Content-Type": "application/json"},
        )

        with urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))


# ─── LangChain Tool Wrapper ───

try:
    from langchain.tools import BaseTool
    from pydantic import BaseModel, Field

    class PurchaseInput(BaseModel):
        vendor: str = Field(description="The vendor or merchant name")
        amount: int = Field(description="Amount in cents (e.g. 4999 = $49.99)")
        reasoning: str = Field(description="Why this purchase is needed")

    class SanctumAuthorizedTool(BaseTool):
        """
        Wraps any purchase action with Sanctum authorization.
        The agent must get approval before the purchase executes.
        """

        name: str = "sanctum_purchase"
        description: str = (
            "Request authorization to make a purchase. "
            "Returns approved, blocked, or pending_approval."
        )
        args_schema: type = PurchaseInput  # type: ignore
        gate: Any = None

        def __init__(self, agent_token: str, category: str = "software", **kwargs: Any):
            super().__init__(**kwargs)
            self.gate = SanctumGate(agent_token=agent_token, default_category=category)

        def _run(self, vendor: str, amount: int, reasoning: str) -> str:
            result = self.gate.authorize(vendor=vendor, amount=amount, reasoning=reasoning)
            status = result.get("status", "unknown")

            if status == "approved":
                analysis = result.get("claudeAnalysis", "")
                return f"APPROVED: Transaction authorized. {analysis}"
            elif status == "pending_approval":
                return f"PENDING: Transaction requires human approval (escalation ID: {result.get('escalationId')})"
            else:
                return f"BLOCKED: {result.get('reason', 'Policy violation')} (rule: {result.get('policyRuleApplied', 'unknown')})"

except ImportError:
    pass  # LangChain not installed, gate still usable standalone
