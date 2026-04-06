import { logError } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { Escalation } from "@/lib/models/Escalation";
import { Transaction } from "@/lib/models/Transaction";
import { Agent } from "@/lib/models/Agent";
import { User } from "@/lib/models/User";
import { isValidObjectId } from "@/lib/validate";

export async function PATCH(req: NextRequest, { params }: { params: { escalationId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!isValidObjectId(params.escalationId)) {
      return NextResponse.json({ error: "Invalid escalation ID" }, { status: 400 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { action } = body;
    if (!["approve", "deny"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be 'approve' or 'deny'" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Atomic: only update if still pending (prevents double-approve)
    const newStatus = action === "approve" ? "approved" : "denied";
    const escalation = await Escalation.findOneAndUpdate(
      { _id: params.escalationId, userId: user._id, status: "pending" },
      { $set: { status: newStatus, respondedAt: new Date() } },
      { new: true }
    );

    if (!escalation) {
      return NextResponse.json({ error: "Escalation not found or already resolved" }, { status: 404 });
    }

    // Verify agent belongs to user
    const agent = await Agent.findOne({ _id: escalation.agentId, userId: user._id });

    if (action === "approve" && agent) {
      // Atomic increment
      await Agent.findByIdAndUpdate(agent._id, {
        $inc: { spentToday: escalation.requestedAmount },
      });

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

      await Escalation.findByIdAndUpdate(escalation._id, { transactionId: tx._id });
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
  } catch (err: any) {
    logError("api", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
