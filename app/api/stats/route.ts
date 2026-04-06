import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { Agent } from "@/lib/models/Agent";
import { Transaction } from "@/lib/models/Transaction";
import { Escalation } from "@/lib/models/Escalation";
import { User } from "@/lib/models/User";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ email: session.user.email });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [activeAgents, transactionsToday, blockedToday, pendingEscalations] = await Promise.all([
    Agent.countDocuments({ userId: user._id, status: "active" }),
    Transaction.find({ userId: user._id, createdAt: { $gte: today } }),
    Transaction.countDocuments({ userId: user._id, status: "blocked", createdAt: { $gte: today } }),
    Escalation.countDocuments({ userId: user._id, status: "pending" }),
  ]);

  const spendToday = transactionsToday
    .filter((t) => t.status === "approved")
    .reduce((sum, t) => sum + t.amount, 0);

  return NextResponse.json({
    activeAgents,
    transactionsToday: transactionsToday.length,
    spendToday,
    blockedToday,
    pendingEscalations,
  });
}
