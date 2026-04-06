"""
Sanctum + CrewAI Integration

Use Sanctum to authorize spending decisions made by CrewAI agents.

Usage:
    from sanctum_crewai import sanctum_tool

    # Add to your CrewAI agent's tools
    agent = Agent(
        role="Procurement Specialist",
        tools=[sanctum_tool("your-agent-token")],
    )
"""

from __future__ import annotations

import json
from typing import Any
from urllib.request import Request, urlopen


def _authorize(
    agent_token: str,
    vendor: str,
    amount: int,
    category: str,
    reasoning: str,
    base_url: str = "https://sanctum-tawny.vercel.app",
) -> dict[str, Any]:
    payload = {
        "agentToken": agent_token,
        "vendor": vendor,
        "amount": amount,
        "currency": "CAD",
        "category": category,
        "reasoning": reasoning,
    }
    data = json.dumps(payload).encode("utf-8")
    req = Request(f"{base_url}/api/authorize", data=data, headers={"Content-Type": "application/json"})
    with urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


try:
    from crewai_tools import tool as crewai_tool

    def sanctum_tool(agent_token: str, default_category: str = "software"):
        """Create a CrewAI-compatible Sanctum authorization tool."""

        @crewai_tool("Authorize Purchase")
        def authorize_purchase(vendor: str, amount_cents: int, reasoning: str) -> str:
            """
            Request authorization to make a purchase through Sanctum.
            Amount is in cents (e.g., 4999 = $49.99).
            Returns whether the transaction is approved, blocked, or needs human approval.
            """
            result = _authorize(
                agent_token=agent_token,
                vendor=vendor,
                amount=amount_cents,
                category=default_category,
                reasoning=reasoning,
            )
            status = result.get("status", "unknown")
            if status == "approved":
                return f"APPROVED: ${amount_cents/100:.2f} at {vendor}. {result.get('claudeAnalysis', '')}"
            elif status == "pending_approval":
                return f"PENDING HUMAN APPROVAL: ${amount_cents/100:.2f} at {vendor}. Escalation ID: {result.get('escalationId')}"
            else:
                return f"BLOCKED: {result.get('reason')} (policy: {result.get('policyRuleApplied')})"

        return authorize_purchase

except ImportError:
    def sanctum_tool(agent_token: str, default_category: str = "software"):
        """Fallback when crewai_tools is not installed."""
        raise ImportError("crewai_tools is required. Install with: pip install crewai-tools")


try:
    from crewai_tools import tool as crewai_tool

    def sanctum_check_tool(agent_token: str):
        """Create a CrewAI tool for checking authorization without executing."""

        @crewai_tool("Check Purchase Authorization")
        def check_authorization(vendor: str, amount_cents: int, category: str, reasoning: str) -> str:
            """
            Check if a purchase would be authorized without actually executing it.
            Use this to pre-validate before committing to a purchase decision.
            """
            result = _authorize(
                agent_token=agent_token,
                vendor=vendor,
                amount=amount_cents,
                category=category,
                reasoning=f"[PRE-CHECK] {reasoning}",
            )
            return json.dumps(result, indent=2)

        return check_authorization

except ImportError:
    pass
