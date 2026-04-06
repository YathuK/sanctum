"""
Sanctum Python SDK
The trust and authorization layer for AI agent commerce.

Usage:
    from sanctum import Sanctum

    client = Sanctum(agent_token="your-token")
    result = client.authorize(
        vendor="AWS",
        amount=4999,
        category="software",
        reasoning="CI/CD pipeline compute",
    )

    if result["status"] == "approved":
        # proceed with purchase
        pass
"""

from .client import Sanctum, SanctumError

__all__ = ["Sanctum", "SanctumError"]
__version__ = "0.1.0"
