import { logError } from "@/lib/logger";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { Agent } from "@/lib/models/Agent";
import { Transaction } from "@/lib/models/Transaction";
import { Escalation } from "@/lib/models/Escalation";
import { User } from "@/lib/models/User";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use aggregation for spend calculation instead of loading all documents
    const [activeAgents, txCountToday, spendAgg, blockedToday, pendingEscalations] = await Promise.all([
      Agent.countDocuments({ userId: user._id, status: "active" }),
      Transaction.countDocuments({ userId: user._id, createdAt: { $gte: today } }),
      Transaction.aggregate([
        { $match: { userId: user._id, status: "approved", createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.countDocuments({ userId: user._id, status: "blocked", createdAt: { $gte: today } }),
      Escalation.countDocuments({ userId: user._id, status: "pending" }),
    ]);

    const spendToday = spendAgg.length > 0 ? spendAgg[0].total : 0;

    return NextResponse.json({
      activeAgents,
      transactionsToday: txCountToday,
      spendToday,
      blockedToday,
      pendingEscalations,
    });
  } catch (err: any) {
    logError("api", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
