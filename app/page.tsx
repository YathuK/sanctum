"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

// ─── Animated counter ───
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const duration = 2000;
          const step = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Animated code block that types out ───
const CODE_LINES = [
  { text: 'const response = await fetch("https://api.sanctum.dev/authorize", {', color: "text-slate-300" },
  { text: '  method: "POST",', color: "text-slate-300" },
  { text: '  headers: { "Content-Type": "application/json" },', color: "text-slate-400" },
  { text: "  body: JSON.stringify({", color: "text-slate-300" },
  { text: '    agentToken: "eyJhbGciOiJIUzI1...",', color: "text-emerald-400" },
  { text: '    vendor: "AWS",', color: "text-amber-400" },
  { text: "    amount: 4999,", color: "text-violet-400" },
  { text: '    category: "software",', color: "text-amber-400" },
  { text: '    reasoning: "CI/CD pipeline compute"', color: "text-emerald-400" },
  { text: "  })", color: "text-slate-300" },
  { text: "});", color: "text-slate-300" },
  { text: "", color: "" },
  { text: "// Response:", color: "text-slate-500" },
  { text: '{  status: "approved",', color: "text-green-400" },
  { text: '   claudeAnalysis: "Legitimate business expense" }', color: "text-green-400" },
];

function TypedCode() {
  const [visibleLines, setVisibleLines] = useState(0);
  const ref = useRef<HTMLPreElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let line = 0;
          const interval = setInterval(() => {
            line++;
            setVisibleLines(line);
            if (line >= CODE_LINES.length) clearInterval(interval);
          }, 150);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <pre ref={ref} className="text-sm leading-relaxed">
      {CODE_LINES.slice(0, visibleLines).map((line, i) => (
        <div key={i} className={`${line.color} transition-opacity duration-300`}>
          {line.text || "\u00A0"}
        </div>
      ))}
      {visibleLines < CODE_LINES.length && (
        <span className="inline-block w-2 h-5 bg-indigo-400 animate-pulse ml-0.5" />
      )}
    </pre>
  );
}

// ─── Animated transaction feed ───
const FEED_ITEMS = [
  { agent: "Procurement Bot", vendor: "AWS", amount: "$49.99", status: "approved", color: "bg-green-500" },
  { agent: "Marketing AI", vendor: "Meta Ads", amount: "$250.00", status: "approved", color: "bg-green-500" },
  { agent: "Travel Agent", vendor: "Casino.com", amount: "$500.00", status: "blocked", color: "bg-red-500" },
  { agent: "Dev Ops Bot", vendor: "GitHub", amount: "$4,200.00", status: "escalated", color: "bg-amber-500" },
  { agent: "Procurement Bot", vendor: "Stripe", amount: "$79.00", status: "approved", color: "bg-green-500" },
  { agent: "Sales AI", vendor: "Salesforce", amount: "$1,500.00", status: "approved", color: "bg-green-500" },
  { agent: "Marketing AI", vendor: "Blocked Vendor", amount: "$99.00", status: "blocked", color: "bg-red-500" },
];

function TransactionFeed() {
  const [items, setItems] = useState<typeof FEED_ITEMS>([]);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let i = 0;
          const interval = setInterval(() => {
            setItems((prev) => [FEED_ITEMS[i % FEED_ITEMS.length], ...prev].slice(0, 5));
            i++;
            if (i >= 7) clearInterval(interval);
          }, 800);
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="space-y-2">
      {items.map((item, i) => (
        <div
          key={`${item.vendor}-${i}`}
          className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-slate-200/50 animate-slide-in"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${item.color}`} />
            <span className="text-sm font-medium text-slate-900">{item.agent}</span>
            <span className="text-xs text-slate-400">at {item.vendor}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-900">{item.amount}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              item.status === "approved" ? "bg-green-100 text-green-700" :
              item.status === "blocked" ? "bg-red-100 text-red-700" :
              "bg-amber-100 text-amber-700"
            }`}>
              {item.status}
            </span>
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
          Waiting for agent transactions...
        </div>
      )}
    </div>
  );
}

// ─── Floating orbs background ───
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute top-1/3 -right-32 w-80 h-80 bg-violet-200/25 rounded-full blur-3xl animate-float-medium" />
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl animate-float-fast" />
    </div>
  );
}

// ─── Shield animation ───
function AnimatedShield() {
  return (
    <div className="relative w-20 h-20 mx-auto">
      <div className="absolute inset-0 bg-indigo-600/20 rounded-2xl animate-ping-slow" />
      <div className="absolute inset-0 bg-indigo-600/10 rounded-2xl animate-ping-slower" />
      <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/25">
        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
    </div>
  );
}

// ─── Feature card with hover ───
function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="group relative bg-white rounded-2xl p-6 border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/50 transition-all duration-300 hover:-translate-y-1">
      <div className="w-12 h-12 bg-indigo-50 group-hover:bg-indigo-100 rounded-xl flex items-center justify-center mb-4 transition-colors">
        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}

// ─── Pricing card ───
function PricingCard({ name, price, features, cta, popular }: {
  name: string; price: string; features: string[]; cta: string; popular?: boolean;
}) {
  return (
    <div className={`relative rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-1 ${
      popular
        ? "bg-gradient-to-b from-indigo-600 to-violet-700 border-indigo-500 shadow-xl shadow-indigo-500/25 text-white"
        : "bg-white border-slate-200 hover:shadow-lg"
    }`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
          MOST POPULAR
        </div>
      )}
      <h3 className={`text-lg font-semibold mb-1 ${popular ? "text-white" : "text-slate-900"}`}>{name}</h3>
      <div className="mb-6">
        <span className={`text-4xl font-bold ${popular ? "text-white" : "text-slate-900"}`}>{price}</span>
        {price !== "Custom" && <span className={`text-sm ${popular ? "text-indigo-200" : "text-slate-400"}`}>/month</span>}
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${popular ? "text-indigo-200" : "text-indigo-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className={popular ? "text-indigo-100" : "text-slate-600"}>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/login"
        className={`block text-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
          popular
            ? "bg-white text-indigo-700 hover:bg-indigo-50"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

// ─── Main page ───
export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden">
      {/* ─── Nav ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 50 ? "bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm" : ""
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900">Sanctum</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">How it Works</a>
            <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
            <a href="#faq" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">FAQ</a>
            <Link href="/docs" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">API Docs</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Log in
            </Link>
            <Link href="/login" className="bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-6">
        <FloatingOrbs />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="mb-6">
              <AnimatedShield />
            </div>
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              <span className="text-xs font-semibold text-indigo-700">Now in public beta</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight mb-6 leading-[1.1]">
              Every agent transaction,{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                authorized.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto mb-10">
              Sanctum is the trust and authorization layer for AI agent commerce. Verified identities, spending policies, and audit trails for every transaction your agents attempt.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="group bg-indigo-600 text-white rounded-2xl px-8 py-4 text-base font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 flex items-center gap-2"
              >
                Get Started Free
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="text-slate-600 rounded-2xl px-8 py-4 text-base font-semibold hover:bg-white hover:shadow-md transition-all duration-200 border border-slate-200"
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* Live transaction feed */}
          <div className="max-w-xl mx-auto">
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-slate-500 ml-2 font-mono">sanctum — live feed</span>
              </div>
              <TransactionFeed />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Logos / Social Proof ─── */}
      <section className="py-12 border-y border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm font-medium text-slate-400 mb-8">TRUSTED BY TEAMS BUILDING WITH AI AGENTS</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-40">
            {["Anthropic", "OpenAI", "LangChain", "AutoGPT"].map((name) => (
              <span key={name} className="text-2xl font-bold text-slate-900 tracking-tight">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 10000, suffix: "+", label: "Agents Secured" },
            { value: 2, suffix: "M+", label: "Transactions Processed" },
            { value: 99, suffix: ".9%", label: "Uptime SLA" },
            { value: 12, suffix: "ms", label: "Avg Response Time" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-1">
                <Counter target={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to control agent spending
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              From identity verification to real-time policy enforcement, Sanctum gives you complete control over what your AI agents can spend and where.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              title="Agent Identity Tokens"
              desc="Every agent gets a cryptographically signed JWT identity token. Verify who is making each transaction with zero ambiguity."
            />
            <FeatureCard
              icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              title="Spending Policies"
              desc="Set per-transaction limits, daily caps, approved categories, and blocked vendors. Policies enforce automatically with zero latency."
            />
            <FeatureCard
              icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              title="Human Escalation"
              desc="Transactions above your threshold are paused and escalated. Approve or deny from your dashboard with one click."
            />
            <FeatureCard
              icon="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              title="Claude AI Analysis"
              desc="Every transaction is analyzed by Claude to assess legitimacy. Get one-sentence verdicts with full reasoning context."
            />
            <FeatureCard
              icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              title="Full Audit Trail"
              desc="Every authorize, block, escalation, and reversal is logged with timestamps, reasoning, and policy context. Export to CSV anytime."
            />
            <FeatureCard
              icon="M13 10V3L4 14h7v7l9-11h-7z"
              title="12ms Authorization"
              desc="Real-time policy checks via a single API call. Your agents get instant approve/block decisions without workflow friction."
            />
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-20 px-6 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Three steps to secure agent commerce
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Get from zero to fully authorized agent transactions in under five minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              { step: "01", title: "Create an Agent", desc: "Define a name, spending policy, and expiry. Get a signed JWT identity token instantly.", icon: "M12 4v16m8-8H4" },
              { step: "02", title: "Call /api/authorize", desc: "Your agent sends its token, vendor, amount, and reasoning. Sanctum validates against every policy rule.", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { step: "03", title: "Get a Decision", desc: "Approved, blocked, or escalated — with Claude analysis and a full audit trail entry for every request.", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className="w-16 h-16 bg-indigo-50 group-hover:bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <div className="text-xs font-bold text-indigo-600 mb-2">STEP {item.step}</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Code example */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-slate-500 ml-2 font-mono">authorize.ts</span>
              </div>
              <TypedCode />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Start free. Scale as your agents do.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard
              name="Developer"
              price="$0"
              cta="Start Free"
              features={[
                "Up to 3 agents",
                "100 transactions/day",
                "Basic spending policies",
                "Transaction audit log",
                "Community support",
              ]}
            />
            <PricingCard
              name="Team"
              price="$49"
              cta="Start Free Trial"
              popular
              features={[
                "Up to 25 agents",
                "5,000 transactions/day",
                "Advanced policies",
                "Claude AI analysis",
                "Human escalation workflows",
                "Webhook notifications",
                "Priority support",
              ]}
            />
            <PricingCard
              name="Enterprise"
              price="Custom"
              cta="Contact Sales"
              features={[
                "Unlimited agents",
                "Unlimited transactions",
                "Custom policy rules",
                "SSO / SAML",
                "Dedicated support",
                "SLA guarantee",
                "On-premise option",
              ]}
            />
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 px-6 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-6">
            {[
              {
                q: "What is Sanctum?",
                a: "Sanctum is the trust and authorization layer for AI agent commerce. It gives every AI agent a verified identity token, a spending policy, and a human-readable audit trail for every transaction it attempts. Think of it as a corporate card policy engine, but for autonomous AI agents.",
              },
              {
                q: "How does AI agent transaction authorization work?",
                a: "When an AI agent needs to make a purchase, it sends a request to the Sanctum /api/authorize endpoint with its identity token, vendor, amount, category, and reasoning. Sanctum verifies the token, checks every policy rule (transaction limits, daily caps, approved categories, blocked vendors), and returns an instant approve, block, or escalate decision. Every transaction is analyzed by Claude and logged.",
              },
              {
                q: "Can I set different spending limits for different agents?",
                a: "Yes. Each agent has its own independent policy with per-transaction limits, daily spending caps, approved spending categories, blocked vendors, and human approval thresholds. You can have a procurement bot with a $500/transaction limit and a marketing bot with a $50/transaction limit running simultaneously.",
              },
              {
                q: "What happens when an AI agent exceeds its spending limit?",
                a: "Sanctum automatically blocks the transaction and records which policy rule was violated. For amounts above the human approval threshold, the transaction is escalated to a human reviewer who can approve or deny it from the dashboard.",
              },
              {
                q: "How fast is the authorization API?",
                a: "Policy checks complete in under 12ms on average. The Claude AI analysis adds a few seconds but runs asynchronously — your agent gets the approve/block decision instantly.",
              },
              {
                q: "Can I reverse a transaction?",
                a: "Yes. Approved transactions can be reversed within 24 hours from the transaction detail page. The agent's daily spend is automatically adjusted.",
              },
            ].map((item) => (
              <details key={item.q} className="group border border-slate-200 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors">
                  <h3 className="text-base font-semibold text-slate-900 pr-4">{item.q}</h3>
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-4">
                  <p className="text-sm text-slate-500 leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Your agents are spending money.<br />
            <span className="text-indigo-200">Shouldn&apos;t you have a say?</span>
          </h2>
          <p className="text-lg text-indigo-200 mb-10 max-w-xl mx-auto">
            Set up Sanctum in five minutes. Get verified identities, spending policies, and audit trails for every AI agent transaction.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 rounded-2xl px-8 py-4 text-base font-semibold hover:bg-indigo-50 transition-all duration-200 shadow-xl shadow-black/10 hover:-translate-y-0.5"
          >
            Start Free Today
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-slate-900 text-slate-400 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-white">Sanctum</span>
              </div>
              <p className="text-sm text-slate-500">The trust and authorization layer for AI agent commerce.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Developers</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-white transition-colors cursor-default">API Reference</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">Documentation</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">SDKs</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">Status</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-white transition-colors cursor-default">About</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">Blog</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">Privacy</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">Terms</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-sm text-slate-500 text-center">
            &copy; {new Date().getFullYear()} Sanctum. All rights reserved. Every agent transaction, authorized.
          </div>
        </div>
      </footer>
    </div>
  );
}
