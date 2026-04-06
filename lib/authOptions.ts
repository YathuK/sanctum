import { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongoClient";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || "smtp.resend.com",
        port: Number(process.env.EMAIL_SERVER_PORT) || 465,
        auth: {
          user: process.env.EMAIL_SERVER_USER || "resend",
          pass: process.env.EMAIL_SERVER_PASSWORD || process.env.RESEND_API_KEY || "",
        },
      },
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      async sendVerificationRequest({ identifier: email, url, provider: { from } }) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) throw new Error("RESEND_API_KEY not set");

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: from || "onboarding@resend.dev",
            to: email,
            subject: "Sign in to Sanctum",
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="display: inline-block; width: 48px; height: 48px; background: #4F46E5; border-radius: 12px; line-height: 48px; font-size: 24px; color: white;">&#x1f6e1;</div>
                  <h1 style="font-size: 24px; font-weight: 700; color: #0F172A; margin: 16px 0 4px;">Sanctum</h1>
                  <p style="font-size: 14px; color: #64748B; margin: 0;">Every agent transaction, authorized.</p>
                </div>
                <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
                  Click the button below to sign in to your Sanctum account. This link expires in 24 hours.
                </p>
                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="${url}" style="display: inline-block; background: #4F46E5; color: white; text-decoration: none; font-size: 15px; font-weight: 600; padding: 12px 32px; border-radius: 12px;">
                    Sign in to Sanctum
                  </a>
                </div>
                <p style="font-size: 13px; color: #94A3B8; text-align: center;">
                  If you didn't request this email, you can safely ignore it.
                </p>
              </div>
            `,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          console.error("Resend error:", error);
          throw new Error(`Failed to send email: ${JSON.stringify(error)}`);
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=true",
  },
  callbacks: {
    async signIn({ user }) {
      await connectDB();
      const existing = await User.findOne({ email: user.email });
      if (!existing) {
        await User.create({ email: user.email });
      }
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: session.user.email });
        if (dbUser) {
          (session as any).userId = dbUser._id.toString();
          (session as any).plan = dbUser.plan;
        }
      }
      return session;
    },
  },
};
