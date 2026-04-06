import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { Escalation } from "@/lib/models/Escalation";
import { User } from "@/lib/models/User";
import { Agent } from "@/lib/models/Agent";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ email: session.user.email });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const escalations = await Escalation.find({ userId: user._id }).sort({ createdAt: -1 });

  const agentIds = [...new Set(escalations.map((e) => e.agentId.toString()))];
  const agents = await Agent.find({ _id: { $in: agentIds } });
  const agentMap = new Map(agents.map((a) => [a._id.toString(), a.name]));

  const results = escalations.map((e) => ({
    ...e.toObject(),
    agentName: agentMap.get(e.agentId.toString()) || "Unknown",
  }));

  return NextResponse.json({ escalations: results });
}
