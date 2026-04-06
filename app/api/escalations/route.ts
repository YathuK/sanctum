import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { Escalation } from "@/lib/models/Escalation";
import { User } from "@/lib/models/User";
import { Agent } from "@/lib/models/Agent";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const escalations = await Escalation.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const agentIds = [...new Set(escalations.map((e: any) => e.agentId.toString()))];
    const agents = agentIds.length > 0
      ? await Agent.find({ _id: { $in: agentIds } }).select("name").lean()
      : [];
    const agentMap = new Map(agents.map((a: any) => [a._id.toString(), a.name]));

    const results = escalations.map((e: any) => ({
      ...e,
      agentName: agentMap.get(e.agentId.toString()) || "Unknown",
    }));

    return NextResponse.json({ escalations: results });
  } catch (err: any) {
    console.error("GET escalations error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
