import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

export async function GET() {
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
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const update: any = {};
  if (body.company !== undefined) update.company = body.company;
  if (body.webhookUrl !== undefined) update.webhookUrl = body.webhookUrl;
  if (body.emailNotifications !== undefined) update.emailNotifications = body.emailNotifications;

  const user = await User.findOneAndUpdate({ email: session.user.email }, update, { new: true });
  return NextResponse.json(user);
}
