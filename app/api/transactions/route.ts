import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/lib/models/Transaction";
import { User } from "@/lib/models/User";
import { Agent } from "@/lib/models/Agent";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ email: session.user.email });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const agentId = url.searchParams.get("agentId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");

  const filter: any = { userId: user._id };
  if (status) filter.status = status;
  if (agentId) filter.agentId = agentId;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  // Attach agent names
  const agentIds = [...new Set(transactions.map((t) => t.agentId.toString()))];
  const agents = await Agent.find({ _id: { $in: agentIds } });
  const agentMap = new Map(agents.map((a) => [a._id.toString(), a.name]));

  const results = transactions.map((t) => ({
    ...t.toObject(),
    agentName: agentMap.get(t.agentId.toString()) || "Unknown",
  }));

  return NextResponse.json({ transactions: results, total, page, pages: Math.ceil(total / limit) });
}
