import { logError } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { Member } from "@/lib/models/Workspace";
import { User } from "@/lib/models/User";
import { sanitizeString, isValidObjectId } from "@/lib/validate";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const workspaceId = sanitizeString(body.workspaceId, 50);
    const email = sanitizeString(body.email, 200).toLowerCase();
    const role = body.role;

    if (!workspaceId || !isValidObjectId(workspaceId)) {
      return NextResponse.json({ error: "Invalid workspace ID" }, { status: 400 });
    }
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    if (!["admin", "approver", "viewer", "api_only"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Verify inviter is admin of workspace
    const inviterMember = await Member.findOne({ workspaceId, userId: user._id });
    if (!inviterMember || inviterMember.role !== "admin") {
      return NextResponse.json({ error: "Only admins can invite members" }, { status: 403 });
    }

    // Find or create invited user
    let invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      invitedUser = await User.create({ email });
    }

    // Check if already a member
    const existing = await Member.findOne({ workspaceId, userId: invitedUser._id });
    if (existing) return NextResponse.json({ error: "User is already a member" }, { status: 409 });

    const member = await Member.create({
      workspaceId,
      userId: invitedUser._id,
      email,
      role,
      invitedBy: user._id,
    });

    return NextResponse.json(member, { status: 201 });
  } catch (err: any) {
    logError("api", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
