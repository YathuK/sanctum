import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/lib/models/Transaction";
import { Agent } from "@/lib/models/Agent";
import { User } from "@/lib/models/User";
import { isValidObjectId } from "@/lib/validate";

export async function POST(req: NextRequest, { params }: { params: { transactionId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!isValidObjectId(params.transactionId)) {
      return NextResponse.json({ error: "Invalid transaction ID" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Atomic: only reverse if status is still "approved" and within 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const tx = await Transaction.findOneAndUpdate(
      {
        _id: params.transactionId,
        userId: user._id,
        status: "approved",
        createdAt: { $gte: twentyFourHoursAgo },
      },
      { $set: { status: "reversed" } },
      { new: true }
    );

    if (!tx) {
      return NextResponse.json({
        error: "Transaction not found, already reversed, or outside 24-hour window"
      }, { status: 400 });
    }

    // Atomic decrement of agent spentToday
    await Agent.findByIdAndUpdate(tx.agentId, {
      $inc: { spentToday: -tx.amount },
    });

    // Ensure spentToday doesn't go below 0
    await Agent.findOneAndUpdate(
      { _id: tx.agentId, spentToday: { $lt: 0 } },
      { $set: { spentToday: 0 } }
    );

    return NextResponse.json(tx);
  } catch (err: any) {
    console.error("Reverse error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
