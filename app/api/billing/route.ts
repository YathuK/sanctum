import { logError } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Workspace } from "@/lib/models/Workspace";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2024-04-10" as any });
}

// GET /api/billing — get billing info
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const workspace = await Workspace.findOne({ ownerId: user._id });

    return NextResponse.json({
      plan: user.plan,
      apiCallsThisMonth: workspace?.apiCallsThisMonth || 0,
      billingCycleStart: workspace?.billingCycleStart,
      limits: {
        developer: { agents: 3, apiCalls: 3000, pricePerCall: 0 },
        team: { agents: 25, apiCalls: 50000, pricePerCall: 0.001 },
        enterprise: { agents: -1, apiCalls: -1, pricePerCall: 0.0005 },
      },
      stripeCustomerId: workspace?.stripeCustomerId || null,
    });
  } catch (err: any) {
    logError("api", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/billing — create checkout session
export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const plan = body.plan;
    if (!["team", "enterprise"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const prices: Record<string, number> = {
      team: 4900,
      enterprise: 49900,
    };

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `Sanctum ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
            description: plan === "team"
              ? "25 agents, 50K API calls/mo, Claude analysis, webhooks"
              : "Unlimited agents, unlimited API calls, SSO, SLA",
          },
          unit_amount: prices[plan],
          recurring: { interval: "month" },
        },
        quantity: 1,
      }],
      metadata: { plan, userId: user._id.toString() },
      success_url: `${process.env.NEXTAUTH_URL || "https://sanctum-tawny.vercel.app"}/settings?billing=success`,
      cancel_url: `${process.env.NEXTAUTH_URL || "https://sanctum-tawny.vercel.app"}/settings?billing=cancelled`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: any) {
    logError("api", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
