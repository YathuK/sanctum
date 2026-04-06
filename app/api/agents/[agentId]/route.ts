import { logError } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { Agent } from "@/lib/models/Agent";
import { User } from "@/lib/models/User";
import { signAgentToken } from "@/lib/jwt";
import { isValidObjectId, sanitizeString } from "@/lib/validate";

async function getUser(session: any) {
  await connectDB();
  return User.findOne({ email: session.user.email });
}

export async function GET(req: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!isValidObjectId(params.agentId)) {
      return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
    }

    const user = await getUser(session);
    const agent = await Agent.findOne({ _id: params.agentId, userId: user!._id });
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    return NextResponse.json(agent);
  } catch (err: any) {
    logError("api", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!isValidObjectId(params.agentId)) {
      return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const user = await getUser(session);
    const agent = await Agent.findOne({ _id: params.agentId, userId: user!._id });
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    if (body.policy) {
      const p = body.policy;
      if (p.maxPerTransaction !== undefined) agent.policy.maxPerTransaction = Math.round(Number(p.maxPerTransaction));
      if (p.maxPerDay !== undefined) agent.policy.maxPerDay = Math.round(Number(p.maxPerDay));
      if (p.requiresApprovalAbove !== undefined) agent.policy.requiresApprovalAbove = Math.round(Number(p.requiresApprovalAbove));
      if (Array.isArray(p.approvedCategories)) agent.policy.approvedCategories = p.approvedCategories;
      if (Array.isArray(p.blockedVendors)) agent.policy.blockedVendors = p.blockedVendors;
    }
    if (body.status && ["active", "suspended"].includes(body.status)) agent.status = body.status;
    if (body.name) agent.name = sanitizeString(body.name, 100);
    if (body.description !== undefined) agent.description = sanitizeString(body.description, 500);

    if (body.regenerateToken) {
      const token = signAgentToken(
        { agentId: agent._id.toString(), userId: user!._id.toString(), policy: agent.policy },
        agent.expiresAt
      );
      agent.token = token;
      await agent.save();
      return NextResponse.json({ ...agent.toObject(), token });
    }

    await agent.save();
    return NextResponse.json(agent);
  } catch (err: any) {
    logError("api", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!isValidObjectId(params.agentId)) {
      return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
    }

    const user = await getUser(session);
    const agent = await Agent.findOneAndUpdate(
      { _id: params.agentId, userId: user!._id },
      { status: "suspended" },
      { new: true }
    );
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    return NextResponse.json(agent);
  } catch (err: any) {
    logError("api", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
