import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { Escalation } from "@/lib/models/Escalation";
import { Transaction } from "@/lib/models/Transaction";
import { Agent } from "@/lib/models/Agent";
import { User } from "@/lib/models/User";

export async function PATCH(req: NextRequest, { params }: { params: { escalationId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ email: session.user.email });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { action } = body;

  if (!["approve", "deny"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const escalation = await Escalation.findOne({ _id: params.escalationId, userId: user._id });
  if (!escalation) return NextResponse.json({ error: "Escalation not found" }, { status: 404 });
  if (escalation.status !== "pending") {
    return NextResponse.json({ error: "Escalation already resolved" }, { status: 400 });
  }

  escalation.status = action === "approve" ? "approved" : "denied";
  escalation.respondedAt = new Date();
  await escalation.save();

  const agent = await Agent.findById(escalation.agentId);

  if (action === "approve" && agent) {
    agent.spentToday += escalation.requestedAmount;
    await agent.save();

    const tx = await Transaction.create({
      agentId: escalation.agentId,
      userId: escalation.userId,
      vendor: escalation.vendor,
      amount: escalation.requestedAmount,
      currency: escalation.currency,
      category: escalation.category,
      agentReasoning: escalation.reason,
      status: "approved",
      policyRuleApplied: "Human approved escalation",
      humanApprovedBy: session.user.email,
      humanApprovedAt: new Date(),
    });
    escalation.transactionId = tx._id;
    await escalation.save();
  } else if (action === "deny") {
    await Transaction.create({
      agentId: escalation.agentId,
      userId: escalation.userId,
      vendor: escalation.vendor,
      amount: escalation.requestedAmount,
      currency: escalation.currency,
      category: escalation.category,
      agentReasoning: escalation.reason,
      status: "blocked",
      policyRuleApplied: "Human denied escalation",
    });
  }

  return NextResponse.json(escalation);
}
