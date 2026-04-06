import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAgentToken } from "@/lib/jwt";
import { Agent } from "@/lib/models/Agent";
import { Transaction } from "@/lib/models/Transaction";
import { Escalation } from "@/lib/models/Escalation";
import { sanitizeString, sanitizeNumber } from "@/lib/validate";
import Anthropic from "@anthropic-ai/sdk";

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
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const agentToken = sanitizeString(body.agentToken, 2000);
    const vendor = sanitizeString(body.vendor, 200);
    const amount = sanitizeNumber(body.amount);
    const currency = sanitizeString(body.currency, 3) || "CAD";
    const category = sanitizeString(body.category, 50);
    const reasoning = sanitizeString(body.reasoning, 1000);

    if (!agentToken || !vendor || !amount || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (amount <= 0 || amount > 100_000_000) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
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

    // Verify token userId matches agent userId
    if (agent.userId.toString() !== payload.userId) {
      return NextResponse.json({ status: "blocked", reason: "Token mismatch" }, { status: 403 });
    }

    // Use fresh policy from DB, not from token
    const policy = agent.policy;

    if (agent.status !== "active") {
      await Transaction.create({
        agentId: agent._id, userId: agent.userId,
        vendor, amount, currency, category,
        agentReasoning: reasoning,
        status: "blocked",
        policyRuleApplied: `Agent is ${agent.status}`,
      });
      return NextResponse.json({ status: "blocked", reason: `Agent is ${agent.status}` });
    }

    if (new Date() > new Date(agent.expiresAt)) {
      await Agent.findByIdAndUpdate(agent._id, { status: "expired" });
      return NextResponse.json({ status: "blocked", reason: "Agent token has expired" });
    }

    // Check blocked vendors
    const blockedVendors = policy.blockedVendors.map((v: string) => v.toLowerCase().trim());
    if (blockedVendors.includes(vendor.toLowerCase().trim())) {
      await Transaction.create({
        agentId: agent._id, userId: agent.userId,
        vendor, amount, currency, category,
        agentReasoning: reasoning,
        status: "blocked",
        policyRuleApplied: "Vendor is blocked",
      });
      return NextResponse.json({ status: "blocked", reason: "Vendor is blocked", policyRuleApplied: "blockedVendors" });
    }

    // Check approved categories
    if (policy.approvedCategories.length > 0 && !policy.approvedCategories.includes(category)) {
      await Transaction.create({
        agentId: agent._id, userId: agent.userId,
        vendor, amount, currency, category,
        agentReasoning: reasoning,
        status: "blocked",
        policyRuleApplied: "Category not approved",
      });
      return NextResponse.json({ status: "blocked", reason: "Category not approved", policyRuleApplied: "approvedCategories" });
    }

    // Check max per transaction
    if (amount > policy.maxPerTransaction) {
      await Transaction.create({
        agentId: agent._id, userId: agent.userId,
        vendor, amount, currency, category,
        agentReasoning: reasoning,
        status: "blocked",
        policyRuleApplied: "Exceeds max per transaction",
      });
      return NextResponse.json({ status: "blocked", reason: "Exceeds max per transaction", policyRuleApplied: "maxPerTransaction" });
    }

    // Check if requires human approval
    if (amount > policy.requiresApprovalAbove) {
      const escalation = await Escalation.create({
        agentId: agent._id,
        userId: agent.userId,
        requestedAmount: amount,
        vendor, category,
        reason: reasoning,
        currency,
      });
      return NextResponse.json({ status: "pending_approval", escalationId: escalation._id });
    }

    // ATOMIC daily spend check + increment
    // Reset if new day, then try to atomically increment
    const today = new Date().toISOString().split("T")[0];

    // First, reset daily spend if it's a new day
    await Agent.findOneAndUpdate(
      { _id: agent._id, lastResetDate: { $ne: today } },
      { $set: { spentToday: 0, lastResetDate: today } }
    );

    // Atomically check and increment spentToday
    const updated = await Agent.findOneAndUpdate(
      {
        _id: agent._id,
        $expr: { $lte: [{ $add: ["$spentToday", amount] }, policy.maxPerDay] },
      },
      { $inc: { spentToday: amount } },
      { new: true }
    );

    if (!updated) {
      await Transaction.create({
        agentId: agent._id, userId: agent.userId,
        vendor, amount, currency, category,
        agentReasoning: reasoning,
        status: "blocked",
        policyRuleApplied: "Exceeds daily spending limit",
      });
      return NextResponse.json({ status: "blocked", reason: "Exceeds daily spending limit", policyRuleApplied: "maxPerDay" });
    }

    // All checks pass — approve
    // Run Claude analysis in background (don't block response)
    const claudeAnalysis = await analyzeWithClaude(amount, vendor, category, reasoning, policy);

    const tx = await Transaction.create({
      agentId: agent._id,
      userId: agent.userId,
      vendor, amount, currency, category,
      agentReasoning: reasoning,
      claudeAnalysis,
      status: "approved",
      policyRuleApplied: "All checks passed",
    });

    return NextResponse.json({ status: "approved", transactionId: tx._id, claudeAnalysis });
  } catch (err: any) {
    console.error("Authorize error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
