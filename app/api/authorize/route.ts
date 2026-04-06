import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAgentToken } from "@/lib/jwt";
import { Agent } from "@/lib/models/Agent";
import { Transaction } from "@/lib/models/Transaction";
import { Escalation } from "@/lib/models/Escalation";
import Anthropic from "@anthropic-ai/sdk";

function resetSpentIfNewDay(agent: any) {
  const today = new Date().toISOString().split("T")[0];
  if (agent.lastResetDate !== today) {
    agent.spentToday = 0;
    agent.lastResetDate = today;
  }
}

async function analyzeWithClaude(
  amount: number,
  vendor: string,
  category: string,
  reasoning: string,
  policy: any
): Promise<string> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `An AI agent requested authorization to spend $${(amount / 100).toFixed(2)} at ${vendor} for ${category}. Agent's reasoning: "${reasoning}". Policy limits: max per transaction $${(policy.maxPerTransaction / 100).toFixed(2)}, max per day $${(policy.maxPerDay / 100).toFixed(2)}, approved categories: ${policy.approvedCategories.join(", ")}. Summarize in one sentence whether this seems like a legitimate business transaction.`,
        },
      ],
    });
    const block = message.content[0];
    return block.type === "text" ? block.text : "";
  } catch {
    return "Analysis unavailable";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentToken, vendor, amount, currency, category, reasoning } = body;

    if (!agentToken || !vendor || !amount || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let payload;
    try {
      payload = verifyAgentToken(agentToken);
    } catch {
      return NextResponse.json({ status: "blocked", reason: "Invalid or expired token" }, { status: 401 });
    }

    await connectDB();

    const agent = await Agent.findById(payload.agentId);
    if (!agent) {
      return NextResponse.json({ status: "blocked", reason: "Agent not found" }, { status: 404 });
    }

    if (agent.status !== "active") {
      const tx = await Transaction.create({
        agentId: agent._id,
        userId: agent.userId,
        vendor, amount, currency: currency || "CAD", category,
        agentReasoning: reasoning || "",
        status: "blocked",
        policyRuleApplied: `Agent is ${agent.status}`,
      });
      return NextResponse.json({ status: "blocked", reason: `Agent is ${agent.status}`, transactionId: tx._id });
    }

    if (new Date() > new Date(agent.expiresAt)) {
      agent.status = "expired";
      await agent.save();
      return NextResponse.json({ status: "blocked", reason: "Agent token has expired" });
    }

    // Check blocked vendors
    const blockedVendors = agent.policy.blockedVendors.map((v: string) => v.toLowerCase());
    if (blockedVendors.includes(vendor.toLowerCase())) {
      const tx = await Transaction.create({
        agentId: agent._id, userId: agent.userId,
        vendor, amount, currency: currency || "CAD", category,
        agentReasoning: reasoning || "",
        status: "blocked",
        policyRuleApplied: "Vendor is blocked",
      });
      return NextResponse.json({ status: "blocked", reason: "Vendor is blocked", policyRuleApplied: "blockedVendors", transactionId: tx._id });
    }

    // Check approved categories
    if (agent.policy.approvedCategories.length > 0 && !agent.policy.approvedCategories.includes(category)) {
      const tx = await Transaction.create({
        agentId: agent._id, userId: agent.userId,
        vendor, amount, currency: currency || "CAD", category,
        agentReasoning: reasoning || "",
        status: "blocked",
        policyRuleApplied: "Category not approved",
      });
      return NextResponse.json({ status: "blocked", reason: "Category not approved", policyRuleApplied: "approvedCategories", transactionId: tx._id });
    }

    // Check max per transaction
    if (amount > agent.policy.maxPerTransaction) {
      const tx = await Transaction.create({
        agentId: agent._id, userId: agent.userId,
        vendor, amount, currency: currency || "CAD", category,
        agentReasoning: reasoning || "",
        status: "blocked",
        policyRuleApplied: "Exceeds max per transaction",
      });
      return NextResponse.json({ status: "blocked", reason: "Exceeds max per transaction", policyRuleApplied: "maxPerTransaction", transactionId: tx._id });
    }

    // Reset daily spend if new day
    resetSpentIfNewDay(agent);

    // Check max per day
    if (agent.spentToday + amount > agent.policy.maxPerDay) {
      const tx = await Transaction.create({
        agentId: agent._id, userId: agent.userId,
        vendor, amount, currency: currency || "CAD", category,
        agentReasoning: reasoning || "",
        status: "blocked",
        policyRuleApplied: "Exceeds daily spending limit",
      });
      return NextResponse.json({ status: "blocked", reason: "Exceeds daily spending limit", policyRuleApplied: "maxPerDay", transactionId: tx._id });
    }

    // Check if requires human approval
    if (amount > agent.policy.requiresApprovalAbove) {
      const escalation = await Escalation.create({
        agentId: agent._id,
        userId: agent.userId,
        requestedAmount: amount,
        vendor,
        category,
        reason: reasoning || "",
        currency: currency || "CAD",
      });
      return NextResponse.json({ status: "pending_approval", escalationId: escalation._id });
    }

    // All checks pass - approve
    const claudeAnalysis = await analyzeWithClaude(amount, vendor, category, reasoning || "", agent.policy);

    agent.spentToday += amount;
    await agent.save();

    const tx = await Transaction.create({
      agentId: agent._id,
      userId: agent.userId,
      vendor, amount, currency: currency || "CAD", category,
      agentReasoning: reasoning || "",
      claudeAnalysis,
      status: "approved",
      policyRuleApplied: "All checks passed",
    });

    return NextResponse.json({ status: "approved", transactionId: tx._id, claudeAnalysis });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
