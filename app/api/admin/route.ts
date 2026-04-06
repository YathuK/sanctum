import { logError } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Agent } from "@/lib/models/Agent";
import { Transaction } from "@/lib/models/Transaction";
import { Escalation } from "@/lib/models/Escalation";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

function isAdmin(email: string): boolean {
  // If no admin emails configured, allow first user (dev mode)
  return ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(session.user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const url = new URL(req.url);
    const section = url.searchParams.get("section") || "overview";

    if (section === "overview") {
      const now = new Date();
      const today = new Date(now); today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalUsers, usersToday, usersThisWeek, usersThisMonth,
        totalAgents, activeAgents,
        totalTransactions, txToday, txThisWeek,
        approvedTx, blockedTx, pendingEscalations,
        revenueAgg, txByDay, txByStatus, topVendors, planDist,
        recentSignups,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ createdAt: { $gte: today } }),
        User.countDocuments({ createdAt: { $gte: weekAgo } }),
        User.countDocuments({ createdAt: { $gte: monthAgo } }),
        Agent.countDocuments(),
        Agent.countDocuments({ status: "active" }),
        Transaction.countDocuments(),
        Transaction.countDocuments({ createdAt: { $gte: today } }),
        Transaction.countDocuments({ createdAt: { $gte: weekAgo } }),
        Transaction.countDocuments({ status: "approved" }),
        Transaction.countDocuments({ status: "blocked" }),
        Escalation.countDocuments({ status: "pending" }),
        // Total volume
        Transaction.aggregate([
          { $match: { status: "approved" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        // Transactions per day (last 14 days)
        Transaction.aggregate([
          { $match: { createdAt: { $gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
              volume: { $sum: "$amount" },
              approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
              blocked: { $sum: { $cond: [{ $eq: ["$status", "blocked"] }, 1, 0] } },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        // Transactions by status
        Transaction.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        // Top vendors by volume
        Transaction.aggregate([
          { $match: { status: "approved" } },
          { $group: { _id: "$vendor", count: { $sum: 1 }, volume: { $sum: "$amount" } } },
          { $sort: { volume: -1 } },
          { $limit: 10 },
        ]),
        // Plan distribution
        User.aggregate([
          { $group: { _id: "$plan", count: { $sum: 1 } } },
        ]),
        // Recent signups
        User.find().sort({ createdAt: -1 }).limit(20).select("email company plan createdAt").lean(),
      ]);

      return NextResponse.json({
        users: {
          total: totalUsers,
          today: usersToday,
          thisWeek: usersThisWeek,
          thisMonth: usersThisMonth,
          recentSignups,
          planDistribution: planDist,
        },
        agents: {
          total: totalAgents,
          active: activeAgents,
        },
        transactions: {
          total: totalTransactions,
          today: txToday,
          thisWeek: txThisWeek,
          approved: approvedTx,
          blocked: blockedTx,
          totalVolume: revenueAgg[0]?.total || 0,
          byDay: txByDay,
          byStatus: txByStatus,
          topVendors,
        },
        escalations: {
          pending: pendingEscalations,
        },
      });
    }

    if (section === "users") {
      const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
      const limit = Math.min(100, parseInt(url.searchParams.get("limit") || "50"));
      const search = url.searchParams.get("search") || "";

      const filter: any = {};
      if (search) {
        filter.$or = [
          { email: { $regex: search, $options: "i" } },
          { company: { $regex: search, $options: "i" } },
        ];
      }

      const [users, total] = await Promise.all([
        User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        User.countDocuments(filter),
      ]);

      // Attach agent count and tx count per user
      const userIds = users.map((u: any) => u._id);
      const [agentCounts, txCounts] = await Promise.all([
        Agent.aggregate([
          { $match: { userId: { $in: userIds } } },
          { $group: { _id: "$userId", count: { $sum: 1 } } },
        ]),
        Transaction.aggregate([
          { $match: { userId: { $in: userIds } } },
          { $group: { _id: "$userId", count: { $sum: 1 }, volume: { $sum: "$amount" } } },
        ]),
      ]);

      const agentMap = new Map(agentCounts.map((a: any) => [a._id.toString(), a.count]));
      const txMap = new Map(txCounts.map((t: any) => [t._id.toString(), { count: t.count, volume: t.volume }]));

      const enriched = users.map((u: any) => ({
        ...u,
        agentCount: agentMap.get(u._id.toString()) || 0,
        transactionCount: txMap.get(u._id.toString())?.count || 0,
        transactionVolume: txMap.get(u._id.toString())?.volume || 0,
      }));

      return NextResponse.json({ users: enriched, total, page, pages: Math.ceil(total / limit) });
    }

    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  } catch (err: any) {
    logError("admin", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
