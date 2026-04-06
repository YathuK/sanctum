import { logError } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/lib/models/Transaction";
import { User } from "@/lib/models/User";
import { Agent } from "@/lib/models/Agent";
import { isValidObjectId, isValidTransactionStatus } from "@/lib/validate";

export async function GET(req: NextRequest) {
  try {
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
    const id = url.searchParams.get("id");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1") || 1);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50") || 50));

    // Direct lookup by ID
    if (id) {
      if (!isValidObjectId(id)) return NextResponse.json({ transactions: [], total: 0, page: 1, pages: 0 });
      const tx = await Transaction.findOne({ _id: id, userId: user._id });
      if (!tx) return NextResponse.json({ transactions: [], total: 0, page: 1, pages: 0 });
      const agent = await Agent.findById(tx.agentId);
      return NextResponse.json({
        transactions: [{ ...tx.toObject(), agentName: agent?.name || "Unknown" }],
        total: 1, page: 1, pages: 1,
      });
    }

    const filter: any = { userId: user._id };
    if (status && isValidTransactionStatus(status)) filter.status = status;
    if (agentId && isValidObjectId(agentId)) filter.agentId = agentId;
    if (from || to) {
      filter.createdAt = {};
      if (from) {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) filter.createdAt.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (!isNaN(toDate.getTime())) filter.createdAt.$lte = toDate;
      }
      if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    // Batch fetch agent names
    const agentIds = [...new Set(transactions.map((t: any) => t.agentId.toString()))];
    const agents = agentIds.length > 0
      ? await Agent.find({ _id: { $in: agentIds } }).select("name").lean()
      : [];
    const agentMap = new Map(agents.map((a: any) => [a._id.toString(), a.name]));

    const results = transactions.map((t: any) => ({
      ...t,
      agentName: agentMap.get(t.agentId.toString()) || "Unknown",
    }));

    return NextResponse.json({ transactions: results, total, page, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    logError("api", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
