import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { Workspace, Member } from "@/lib/models/Workspace";
import { User } from "@/lib/models/User";
import { sanitizeString } from "@/lib/validate";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Get all workspaces where user is a member
    const memberships = await Member.find({ userId: user._id }).lean();
    const workspaceIds = memberships.map((m: any) => m.workspaceId);

    // Also include owned workspaces
    const workspaces = await Workspace.find({
      $or: [{ _id: { $in: workspaceIds } }, { ownerId: user._id }],
    }).sort({ createdAt: -1 }).lean();

    // Attach user's role for each workspace
    const results = workspaces.map((ws: any) => {
      const membership = memberships.find((m: any) => m.workspaceId.toString() === ws._id.toString());
      return {
        ...ws,
        role: ws.ownerId.toString() === user._id.toString() ? "admin" : membership?.role || "viewer",
      };
    });

    return NextResponse.json(results);
  } catch (err: any) {
    console.error("GET workspaces error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const name = sanitizeString(body.name, 100);
    if (!name) return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 50);

    // Check slug uniqueness
    const existing = await Workspace.findOne({ slug });
    if (existing) return NextResponse.json({ error: "Workspace name already taken" }, { status: 409 });

    const workspace = await Workspace.create({
      name,
      slug,
      ownerId: user._id,
      plan: user.plan || "developer",
    });

    // Add owner as admin member
    await Member.create({
      workspaceId: workspace._id,
      userId: user._id,
      email: user.email,
      role: "admin",
      invitedBy: user._id,
    });

    return NextResponse.json(workspace, { status: 201 });
  } catch (err: any) {
    console.error("POST workspaces error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
