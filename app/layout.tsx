import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sanctum — AI Agent Transaction Authorization | Trust Layer for Agent Commerce",
  description: "Sanctum is the trust and authorization layer for AI agent commerce. Give every AI agent a verified identity, spending policy, and human-readable audit trail. Authorize agent transactions in real-time with policy enforcement and Claude-powered analysis.",
  keywords: ["AI agent authorization", "agent commerce", "AI spending limits", "agent transaction control", "AI trust layer", "agent identity tokens", "AI procurement", "autonomous agent payments", "agent policy enforcement", "AI agent security"],
  authors: [{ name: "Sanctum" }],
  openGraph: {
    title: "Sanctum — Every Agent Transaction, Authorized",
    description: "The trust and authorization layer for AI agent commerce. Verified identities, spending policies, and audit trails for every AI agent transaction.",
    url: "https://sanctum-tawny.vercel.app",
    siteName: "Sanctum",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sanctum — AI Agent Transaction Authorization",
    description: "Give every AI agent a verified identity, spending policy, and audit trail. The trust layer for agent commerce.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://sanctum-tawny.vercel.app",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Sanctum",
              applicationCategory: "SecurityApplication",
              description: "The trust and authorization layer for AI agent commerce. Verified identity tokens, spending policies, and audit trails for every AI agent transaction.",
              operatingSystem: "Web",
              offers: {
                "@type": "AggregateOffer",
                lowPrice: "0",
                highPrice: "499",
                priceCurrency: "USD",
                offerCount: "3",
              },
              featureList: [
                "AI Agent Identity Tokens (JWT)",
                "Per-transaction and daily spending limits",
                "Category-based access control",
                "Vendor blocking",
                "Human-in-the-loop escalation workflows",
                "Claude-powered transaction analysis",
                "Real-time authorization API",
                "Full audit trail",
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What is Sanctum?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Sanctum is the trust and authorization layer for AI agent commerce. It gives every AI agent a verified identity token, a spending policy, and a human-readable audit trail for every transaction it attempts.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How does AI agent transaction authorization work?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "When an AI agent needs to make a purchase, it sends a request to the Sanctum API with its identity token, vendor, amount, and reasoning. Sanctum verifies the token, checks the agent's spending policy (transaction limits, daily limits, approved categories, blocked vendors), and returns an instant approve/block/escalate decision. Every transaction is analyzed by Claude AI and logged with a full audit trail.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Can I set spending limits for AI agents?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Sanctum allows you to set per-transaction limits, daily spending caps, approved spending categories, blocked vendors, and approval thresholds above which a human must review the transaction.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What happens when an AI agent exceeds its spending limit?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Sanctum automatically blocks the transaction and records the policy rule that was violated. For amounts above the human approval threshold, the transaction is escalated to a human reviewer who can approve or deny it from the dashboard.",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.className} antialiased bg-slate-50`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
