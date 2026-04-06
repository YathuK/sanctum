import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { Agent } from "@/lib/models/Agent";
import { User } from "@/lib/models/User";
import { signAgentToken } from "@/lib/jwt";

async function getUser(session: any) {
  await connectDB();
  return User.findOne({ email: session.user.email });
}

export async function GET(req: NextRequest, { params }: { params: { agentId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUser(session);
  const agent = await Agent.findOne({ _id: params.agentId, userId: user!._id });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  return NextResponse.json(agent);
}

export async function PATCH(req: NextRequest, { params }: { params: { agentId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUser(session);
  const body = await req.json();

  const agent = await Agent.findOne({ _id: params.agentId, userId: user!._id });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  if (body.policy) agent.policy = { ...agent.policy, ...body.policy };
  if (body.status) agent.status = body.status;
  if (body.name) agent.name = body.name;
  if (body.description !== undefined) agent.description = body.description;

  if (body.regenerateToken) {
    const token = signAgentToken(
      {
        agentId: agent._id.toString(),
        userId: user!._id.toString(),
        policy: agent.policy,
      },
      agent.expiresAt
    );
    agent.token = token;
    await agent.save();
    return NextResponse.json({ ...agent.toObject(), token });
  }

  await agent.save();
  return NextResponse.json(agent);
}

export async function DELETE(req: NextRequest, { params }: { params: { agentId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUser(session);
  const agent = await Agent.findOneAndUpdate(
    { _id: params.agentId, userId: user!._id },
    { status: "suspended" },
    { new: true }
  );
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  return NextResponse.json(agent);
}
