import { logError } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { Agent } from "@/lib/models/Agent";
import { User } from "@/lib/models/User";
import { signAgentToken } from "@/lib/jwt";
import { sanitizeString, sanitizeStringArray, isValidExpiryDate } from "@/lib/validate";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const agents = await Agent.find({ userId: user._id }).sort({ createdAt: -1 }).limit(100);
    return NextResponse.json(agents);
  } catch (err: any) {
    logError("api", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const name = sanitizeString(body.name, 100);
    const description = sanitizeString(body.description, 500);
    const { policy, expiresAt } = body;

    if (!name || !policy || !expiresAt) {
      return NextResponse.json({ error: "Missing required fields: name, policy, expiresAt" }, { status: 400 });
    }

    // Validate policy fields
    const maxPerTransaction = Math.round(Number(policy.maxPerTransaction));
    const maxPerDay = Math.round(Number(policy.maxPerDay));
    const requiresApprovalAbove = Math.round(Number(policy.requiresApprovalAbove) || 999999999);

    if (!Number.isFinite(maxPerTransaction) || maxPerTransaction <= 0) {
      return NextResponse.json({ error: "Invalid maxPerTransaction" }, { status: 400 });
    }
    if (!Number.isFinite(maxPerDay) || maxPerDay <= 0) {
      return NextResponse.json({ error: "Invalid maxPerDay" }, { status: 400 });
    }

    const expiresDate = new Date(expiresAt);
    if (isNaN(expiresDate.getTime()) || !isValidExpiryDate(expiresDate)) {
      return NextResponse.json({ error: "expiresAt must be a valid future date (max 1 year)" }, { status: 400 });
    }

    const approvedCategories = sanitizeStringArray(policy.approvedCategories, 20, 50);
    const blockedVendors = sanitizeStringArray(policy.blockedVendors, 100, 200);

    const agentId = new mongoose.Types.ObjectId();

    const cleanPolicy = {
      maxPerTransaction,
      maxPerDay,
      approvedCategories,
      blockedVendors,
      requiresApprovalAbove,
      currency: policy.currency === "USD" ? "USD" : "CAD",
    };

    const token = signAgentToken(
      { agentId: agentId.toString(), userId: user._id.toString(), policy: cleanPolicy },
      expiresDate
    );

    const agent = await Agent.create({
      _id: agentId,
      userId: user._id,
      name,
      description,
      token,
      policy: cleanPolicy,
      expiresAt: expiresDate,
    });

    return NextResponse.json({ ...agent.toObject(), token }, { status: 201 });
  } catch (err: any) {
    logError("api", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
