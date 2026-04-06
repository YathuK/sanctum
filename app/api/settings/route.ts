import { logError } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { sanitizeString, isValidHttpsUrl } from "@/lib/validate";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      company: user.company,
      webhookUrl: user.webhookUrl,
      emailNotifications: user.emailNotifications,
      plan: user.plan,
      email: user.email,
    });
  } catch (err: any) {
    logError("api", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    await connectDB();
    const update: any = {};
    if (body.company !== undefined) update.company = sanitizeString(body.company, 200);
    if (body.webhookUrl !== undefined) {
      const url = sanitizeString(body.webhookUrl, 500);
      if (url && !isValidHttpsUrl(url)) {
        return NextResponse.json({ error: "Invalid webhook URL" }, { status: 400 });
      }
      update.webhookUrl = url;
    }
    if (body.emailNotifications !== undefined) update.emailNotifications = Boolean(body.emailNotifications);

    const user = await User.findOneAndUpdate({ email: session.user.email }, update, { new: true });
    return NextResponse.json(user);
  } catch (err: any) {
    logError("api", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
