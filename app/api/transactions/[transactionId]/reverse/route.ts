import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/lib/models/Transaction";
import { Agent } from "@/lib/models/Agent";
import { User } from "@/lib/models/User";

export async function POST(req: NextRequest, { params }: { params: { transactionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ email: session.user.email });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const tx = await Transaction.findOne({ _id: params.transactionId, userId: user._id });
  if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

  if (tx.status !== "approved") {
    return NextResponse.json({ error: "Can only reverse approved transactions" }, { status: 400 });
  }

  const hoursSince = (Date.now() - new Date(tx.createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursSince > 24) {
    return NextResponse.json({ error: "Can only reverse transactions within 24 hours" }, { status: 400 });
  }

  tx.status = "reversed";
  await tx.save();

  const agent = await Agent.findById(tx.agentId);
  if (agent) {
    agent.spentToday = Math.max(0, agent.spentToday - tx.amount);
    await agent.save();
  }

  return NextResponse.json(tx);
}
