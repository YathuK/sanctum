import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { Agent } from "@/lib/models/Agent";
import { User } from "@/lib/models/User";
import { signAgentToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findOne({ email: session.user.email });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const agents = await Agent.find({ userId: user._id }).sort({ createdAt: -1 });
  return NextResponse.json(agents);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findOne({ email: session.user.email });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { name, description, policy, expiresAt } = body;

  if (!name || !policy || !expiresAt) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const expiresDate = new Date(expiresAt);
  const agentId = new (require("mongoose").Types.ObjectId)();

  const token = signAgentToken(
    {
      agentId: agentId.toString(),
      userId: user._id.toString(),
      policy,
    },
    expiresDate
  );

  const agent = await Agent.create({
    _id: agentId,
    userId: user._id,
    name,
    description: description || "",
    token,
    policy,
    expiresAt: expiresDate,
  });

  return NextResponse.json({ ...agent.toObject(), token }, { status: 201 });
}
