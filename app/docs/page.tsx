"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

// ─── Section IDs ───
const SECTIONS = [
  { id: "introduction", label: "Introduction" },
  { id: "authentication", label: "Authentication" },
  { id: "authorize", label: "POST /api/authorize" },
  { id: "create-agent", label: "POST /api/agents" },
  { id: "list-agents", label: "GET /api/agents" },
  { id: "update-agent", label: "PATCH /api/agents/:id" },
  { id: "list-transactions", label: "GET /api/transactions" },
  { id: "reverse-transaction", label: "POST /api/.../reverse" },
  { id: "resolve-escalation", label: "PATCH /api/escalations/:id" },
  { id: "sdk", label: "SDKs" },
  { id: "sandbox", label: "Sandbox Mode" },
  { id: "rate-limits", label: "Rate Limits" },
  { id: "errors", label: "Error Codes" },
];

// ─── Method badge ───
function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-blue-100 text-blue-700 border-blue-200",
    POST: "bg-emerald-100 text-emerald-700 border-emerald-200",
    PATCH: "bg-amber-100 text-amber-700 border-amber-200",
    DELETE: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border tracking-wide ${colors[method] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}
    >
      {method}
    </span>
  );
}

// ─── Code tabs ───
function CodeTabs({
  tabs,
}: {
  tabs: { label: string; code: string; lang: string }[];
}) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(tabs[active].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg overflow-hidden border border-slate-800 my-4">
      <div className="flex items-center bg-slate-800 border-b border-slate-700 px-1">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActive(i)}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              i === active
                ? "text-white bg-slate-900 rounded-t-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={copy}
          className="ml-auto mr-2 px-3 py-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="bg-slate-900 p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-slate-300">{tabs[active].code}</code>
      </pre>
    </div>
  );
}

// ─── Single code block ───
function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg overflow-hidden border border-slate-800 my-4 relative group">
      <button
        onClick={copy}
        className="absolute top-2 right-2 px-3 py-1 text-xs text-slate-500 hover:text-white bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className="bg-slate-900 p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-slate-300">{code}</code>
      </pre>
    </div>
  );
}

// ─── Param table ───
function ParamTable({
  params,
}: {
  params: { name: string; type: string; required?: boolean; description: string }[];
}) {
  return (
    <div className="overflow-x-auto my-4 border border-slate-200 rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-left">
            <th className="px-4 py-3 font-semibold text-slate-700">Parameter</th>
            <th className="px-4 py-3 font-semibold text-slate-700">Type</th>
            <th className="px-4 py-3 font-semibold text-slate-700">Required</th>
            <th className="px-4 py-3 font-semibold text-slate-700">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-t border-slate-100">
              <td className="px-4 py-3 font-mono text-indigo-600 text-xs">{p.name}</td>
              <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.type}</td>
              <td className="px-4 py-3">
                {p.required ? (
                  <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Required</span>
                ) : (
                  <span className="text-xs text-slate-400">Optional</span>
                )}
              </td>
              <td className="px-4 py-3 text-slate-600">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Section heading ───
function SectionHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2 id={id} className="text-2xl font-bold text-slate-900 mt-16 mb-4 scroll-mt-24 flex items-center gap-3">
      {children}
    </h2>
  );
}

// ─── Main page ───
export default function DocsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("introduction");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Top nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-16 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900"
              aria-label="Toggle navigation"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Sanctum</span>
            </Link>
            <span className="hidden sm:inline-block text-sm font-medium text-slate-400 border-l border-slate-200 pl-6">
              API Reference
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors hidden sm:inline-block"
            >
              Back to home
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="flex">
          {/* ── Sidebar overlay (mobile) ── */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* ── Sidebar ── */}
          <aside
            className={`
              fixed top-16 bottom-0 left-0 z-40 w-72 bg-white border-r border-slate-200 overflow-y-auto px-6 py-8
              transition-transform lg:transition-none
              lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-56 lg:shrink-0 lg:block lg:border-r-0 lg:translate-x-0
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              On this page
            </p>
            <nav className="space-y-1">
              {SECTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                    activeSection === id
                      ? "text-indigo-700 bg-indigo-50 font-medium"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0 lg:pl-12 py-12 max-w-3xl">
            {/* Introduction */}
            <section id="introduction">
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                Sanctum API Reference
              </h1>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                The Sanctum API lets AI agents request authorization for financial transactions
                in real time. Every request is verified against the agent&apos;s spending policy,
                analyzed by Claude AI, and logged with a full audit trail.
              </p>
              <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-sm text-slate-500 font-medium mb-1">Base URL</p>
                <code className="text-sm font-mono text-indigo-600 font-semibold">
                  https://api.sanctum.dev/v1
                </code>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                All endpoints accept and return JSON. HTTPS is required for all requests.
              </p>
            </section>

            {/* Authentication */}
            <SectionHeading id="authentication">Authentication</SectionHeading>
            <p className="text-slate-600 leading-relaxed">
              Sanctum uses two authentication methods depending on the endpoint:
            </p>
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                <p className="font-semibold text-indigo-900 text-sm">Agent Tokens (JWT)</p>
                <p className="mt-1 text-sm text-indigo-800">
                  Used by AI agents to call the <code className="bg-indigo-100 px-1 rounded">/api/authorize</code> endpoint.
                  Each agent receives a unique JWT token when created via the dashboard or API.
                  Include it in the request body as <code className="bg-indigo-100 px-1 rounded">agentToken</code>.
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="font-semibold text-slate-900 text-sm">Session Auth (Cookie)</p>
                <p className="mt-1 text-sm text-slate-600">
                  Used for management endpoints (agents, transactions, escalations).
                  Authenticate via <code className="bg-slate-100 px-1 rounded">/api/auth</code> (NextAuth) to get a session cookie.
                  All dashboard API requests use this session automatically.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              To obtain an agent token, create an agent through the{" "}
              <Link href="/dashboard" className="text-indigo-600 hover:underline">dashboard</Link>{" "}
              or via the <button onClick={() => scrollTo("create-agent")} className="text-indigo-600 hover:underline">POST /api/agents</button> endpoint.
              The token is returned in the response and shown once in the dashboard.
            </p>
            <CodeBlock
              code={`// Include the agent token in your authorize request body
{
  "agentToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "vendor": "AWS",
  "amount": 4999,
  ...
}`}
            />

            {/* POST /api/authorize */}
            <SectionHeading id="authorize">
              <MethodBadge method="POST" />
              <span className="font-mono text-xl">/api/authorize</span>
            </SectionHeading>
            <p className="text-slate-600 leading-relaxed">
              The core endpoint. An AI agent calls this to request authorization for a transaction.
              Sanctum validates the agent token, checks the transaction against the agent&apos;s
              spending policy, runs Claude AI analysis, and returns an instant decision.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-8 mb-3">Request Body</h3>
            <ParamTable
              params={[
                { name: "agentToken", type: "string", required: true, description: "The agent's JWT identity token." },
                { name: "vendor", type: "string", required: true, description: "Name of the vendor or service being purchased from." },
                { name: "amount", type: "number", required: true, description: "Transaction amount in the smallest currency unit (e.g. cents). 4999 = $49.99." },
                { name: "currency", type: "string", required: false, description: "ISO 4217 currency code. Defaults to USD." },
                { name: "category", type: "string", required: true, description: 'Spending category (e.g. "software", "cloud_compute", "marketing", "office_supplies").' },
                { name: "reasoning", type: "string", required: true, description: "Agent's explanation for why this transaction is needed. Used for AI analysis and audit trail." },
                { name: "sandbox", type: "boolean", required: false, description: "If true, simulates the authorization without recording a transaction." },
              ]}
            />

            <h3 className="text-lg font-semibold text-slate-800 mt-8 mb-3">Response</h3>
            <p className="text-sm text-slate-600 mb-4">
              Returns one of three decision statuses:
            </p>

            <div className="space-y-3">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="font-semibold text-emerald-800 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  approved
                </p>
                <p className="text-sm text-emerald-700 mt-1">
                  Transaction is within policy limits. The agent may proceed.
                </p>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-semibold text-red-800 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  blocked
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Transaction violates a policy rule (exceeds limits, blocked vendor, etc.).
                </p>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="font-semibold text-amber-800 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  pending_approval
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Amount exceeds the human approval threshold. Escalated to a human reviewer.
                </p>
              </div>
            </div>

            <CodeBlock
              code={`// Approved response
{
  "status": "approved",
  "transactionId": "txn_abc123def456",
  "decision": {
    "result": "approved",
    "policyChecks": {
      "transactionLimit": "pass",
      "dailyLimit": "pass",
      "categoryAllowed": "pass",
      "vendorAllowed": "pass"
    },
    "aiAnalysis": {
      "riskScore": 12,
      "summary": "Routine cloud compute purchase within normal spending patterns."
    }
  }
}

// Blocked response
{
  "status": "blocked",
  "reason": "Transaction amount $499.99 exceeds per-transaction limit of $200.00",
  "policyRule": "transaction_limit",
  "decision": {
    "result": "blocked",
    "policyChecks": {
      "transactionLimit": "fail",
      "dailyLimit": "pass",
      "categoryAllowed": "pass",
      "vendorAllowed": "pass"
    }
  }
}

// Pending approval response
{
  "status": "pending_approval",
  "escalationId": "esc_789xyz",
  "message": "Amount exceeds approval threshold. Awaiting human review.",
  "decision": {
    "result": "pending_approval",
    "policyChecks": {
      "transactionLimit": "pass",
      "dailyLimit": "pass",
      "categoryAllowed": "pass",
      "vendorAllowed": "pass",
      "approvalThreshold": "escalated"
    }
  }
}`}
            />

            <h3 className="text-lg font-semibold text-slate-800 mt-8 mb-3">Code Examples</h3>
            <CodeTabs
              tabs={[
                {
                  label: "Node.js",
                  lang: "javascript",
                  code: `const response = await fetch("https://api.sanctum.dev/v1/authorize", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    agentToken: process.env.SANCTUM_AGENT_TOKEN,
    vendor: "AWS",
    amount: 4999,
    currency: "USD",
    category: "cloud_compute",
    reasoning: "Provisioning EC2 instances for CI/CD pipeline"
  })
});

const { status, transactionId, decision } = await response.json();

if (status === "approved") {
  console.log("Transaction approved:", transactionId);
  // Proceed with purchase
} else if (status === "pending_approval") {
  console.log("Awaiting human approval...");
  // Poll or wait for webhook
} else {
  console.log("Transaction blocked:", decision.policyChecks);
}`,
                },
                {
                  label: "Python",
                  lang: "python",
                  code: `import requests
import os

response = requests.post(
    "https://api.sanctum.dev/v1/authorize",
    json={
        "agentToken": os.environ["SANCTUM_AGENT_TOKEN"],
        "vendor": "AWS",
        "amount": 4999,
        "currency": "USD",
        "category": "cloud_compute",
        "reasoning": "Provisioning EC2 instances for CI/CD pipeline"
    }
)

data = response.json()

if data["status"] == "approved":
    print(f"Approved: {data['transactionId']}")
    # Proceed with purchase
elif data["status"] == "pending_approval":
    print("Awaiting human approval...")
    # Poll or wait for webhook
else:
    print(f"Blocked: {data.get('reason')}")`,
                },
                {
                  label: "cURL",
                  lang: "bash",
                  code: `curl -X POST https://api.sanctum.dev/v1/authorize \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentToken": "eyJhbGciOiJIUzI1NiIs...",
    "vendor": "AWS",
    "amount": 4999,
    "currency": "USD",
    "category": "cloud_compute",
    "reasoning": "Provisioning EC2 instances for CI/CD pipeline"
  }'`,
                },
              ]}
            />

            {/* POST /api/agents */}
            <SectionHeading id="create-agent">
              <MethodBadge method="POST" />
              <span className="font-mono text-xl">/api/agents</span>
            </SectionHeading>
            <p className="text-slate-600 leading-relaxed">
              Create a new AI agent with a spending policy. Returns the agent record
              including the JWT token. Requires session authentication.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-8 mb-3">Request Body</h3>
            <ParamTable
              params={[
                { name: "name", type: "string", required: true, description: "Display name for the agent." },
                { name: "description", type: "string", required: false, description: "Description of the agent's purpose." },
                { name: "policy", type: "object", required: true, description: "The agent's spending policy (see fields below)." },
                { name: "policy.transactionLimit", type: "number", required: true, description: "Max amount per transaction (in cents)." },
                { name: "policy.dailyLimit", type: "number", required: true, description: "Max total spend per day (in cents)." },
                { name: "policy.approvalThreshold", type: "number", required: false, description: "Amount above which transactions are escalated to a human." },
                { name: "policy.allowedCategories", type: "string[]", required: false, description: 'Permitted spending categories. Empty array means all allowed.' },
                { name: "policy.blockedVendors", type: "string[]", required: false, description: "List of vendor names to block." },
              ]}
            />

            <CodeTabs
              tabs={[
                {
                  label: "Node.js",
                  lang: "javascript",
                  code: `const response = await fetch("https://api.sanctum.dev/v1/agents", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    name: "Procurement Bot",
    description: "Handles SaaS and cloud infrastructure purchases",
    policy: {
      transactionLimit: 50000,   // $500.00
      dailyLimit: 200000,        // $2,000.00
      approvalThreshold: 100000, // $1,000.00 requires human approval
      allowedCategories: ["software", "cloud_compute", "saas"],
      blockedVendors: []
    }
  })
});

const { agent, token } = await response.json();
// Store this token securely - it is only shown once
console.log("Agent token:", token);`,
                },
                {
                  label: "cURL",
                  lang: "bash",
                  code: `curl -X POST https://api.sanctum.dev/v1/agents \\
  -H "Content-Type: application/json" \\
  -H "Cookie: next-auth.session-token=..." \\
  -d '{
    "name": "Procurement Bot",
    "description": "Handles SaaS and cloud infrastructure purchases",
    "policy": {
      "transactionLimit": 50000,
      "dailyLimit": 200000,
      "approvalThreshold": 100000,
      "allowedCategories": ["software", "cloud_compute", "saas"],
      "blockedVendors": []
    }
  }'`,
                },
              ]}
            />

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">Response</h3>
            <CodeBlock
              code={`{
  "agent": {
    "id": "agent_abc123",
    "name": "Procurement Bot",
    "description": "Handles SaaS and cloud infrastructure purchases",
    "status": "active",
    "policy": {
      "transactionLimit": 50000,
      "dailyLimit": 200000,
      "approvalThreshold": 100000,
      "allowedCategories": ["software", "cloud_compute", "saas"],
      "blockedVendors": []
    },
    "createdAt": "2026-04-06T12:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}`}
            />

            {/* GET /api/agents */}
            <SectionHeading id="list-agents">
              <MethodBadge method="GET" />
              <span className="font-mono text-xl">/api/agents</span>
            </SectionHeading>
            <p className="text-slate-600 leading-relaxed">
              List all agents for your account. Requires session authentication.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">Query Parameters</h3>
            <ParamTable
              params={[
                { name: "status", type: "string", required: false, description: 'Filter by status: "active", "paused", or "revoked".' },
                { name: "limit", type: "number", required: false, description: "Max results to return. Default 50." },
                { name: "offset", type: "number", required: false, description: "Pagination offset. Default 0." },
              ]}
            />

            <CodeBlock
              code={`// Response
{
  "agents": [
    {
      "id": "agent_abc123",
      "name": "Procurement Bot",
      "status": "active",
      "policy": { ... },
      "todaySpend": 12500,
      "transactionCount": 7,
      "createdAt": "2026-04-06T12:00:00Z"
    }
  ],
  "total": 3,
  "limit": 50,
  "offset": 0
}`}
            />

            {/* PATCH /api/agents/:id */}
            <SectionHeading id="update-agent">
              <MethodBadge method="PATCH" />
              <span className="font-mono text-xl">/api/agents/:id</span>
            </SectionHeading>
            <p className="text-slate-600 leading-relaxed">
              Update an agent&apos;s policy, status, or metadata. Requires session authentication.
              Send only the fields you want to change.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">Path Parameters</h3>
            <ParamTable
              params={[
                { name: "id", type: "string", required: true, description: "The agent ID (e.g. agent_abc123)." },
              ]}
            />

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">Request Body</h3>
            <ParamTable
              params={[
                { name: "name", type: "string", required: false, description: "Update the agent display name." },
                { name: "status", type: "string", required: false, description: 'Set to "active", "paused", or "revoked".' },
                { name: "policy", type: "object", required: false, description: "Partial policy update. Merges with existing policy." },
              ]}
            />

            <CodeTabs
              tabs={[
                {
                  label: "Node.js",
                  lang: "javascript",
                  code: `await fetch("https://api.sanctum.dev/v1/agents/agent_abc123", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    policy: {
      transactionLimit: 100000,  // Increase to $1,000
      blockedVendors: ["ShadyCorp"]
    }
  })
});`,
                },
                {
                  label: "cURL",
                  lang: "bash",
                  code: `curl -X PATCH https://api.sanctum.dev/v1/agents/agent_abc123 \\
  -H "Content-Type: application/json" \\
  -H "Cookie: next-auth.session-token=..." \\
  -d '{
    "policy": {
      "transactionLimit": 100000,
      "blockedVendors": ["ShadyCorp"]
    }
  }'`,
                },
              ]}
            />

            {/* GET /api/transactions */}
            <SectionHeading id="list-transactions">
              <MethodBadge method="GET" />
              <span className="font-mono text-xl">/api/transactions</span>
            </SectionHeading>
            <p className="text-slate-600 leading-relaxed">
              List transactions with filtering, sorting, and pagination. Requires session authentication.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">Query Parameters</h3>
            <ParamTable
              params={[
                { name: "agentId", type: "string", required: false, description: "Filter by agent ID." },
                { name: "status", type: "string", required: false, description: 'Filter: "approved", "blocked", "pending_approval", "reversed".' },
                { name: "category", type: "string", required: false, description: "Filter by spending category." },
                { name: "vendor", type: "string", required: false, description: "Filter by vendor name (partial match)." },
                { name: "minAmount", type: "number", required: false, description: "Minimum amount filter (in cents)." },
                { name: "maxAmount", type: "number", required: false, description: "Maximum amount filter (in cents)." },
                { name: "from", type: "string", required: false, description: "Start date (ISO 8601)." },
                { name: "to", type: "string", required: false, description: "End date (ISO 8601)." },
                { name: "limit", type: "number", required: false, description: "Max results. Default 50, max 200." },
                { name: "offset", type: "number", required: false, description: "Pagination offset." },
                { name: "sort", type: "string", required: false, description: 'Sort field. Default "createdAt". Options: "amount", "createdAt".' },
                { name: "order", type: "string", required: false, description: '"asc" or "desc". Default "desc".' },
              ]}
            />

            <CodeBlock
              code={`// GET /api/transactions?agentId=agent_abc123&status=approved&limit=10

{
  "transactions": [
    {
      "id": "txn_abc123def456",
      "agentId": "agent_abc123",
      "agentName": "Procurement Bot",
      "vendor": "AWS",
      "amount": 4999,
      "currency": "USD",
      "category": "cloud_compute",
      "status": "approved",
      "reasoning": "Provisioning EC2 instances for CI/CD pipeline",
      "aiAnalysis": {
        "riskScore": 12,
        "summary": "Routine cloud compute purchase."
      },
      "policyChecks": { ... },
      "createdAt": "2026-04-06T14:30:00Z"
    }
  ],
  "total": 142,
  "limit": 10,
  "offset": 0
}`}
            />

            {/* POST /api/transactions/:id/reverse */}
            <SectionHeading id="reverse-transaction">
              <MethodBadge method="POST" />
              <span className="font-mono text-xl">/api/transactions/:id/reverse</span>
            </SectionHeading>
            <p className="text-slate-600 leading-relaxed">
              Reverse a previously approved transaction. This marks the transaction as reversed
              and adjusts the agent&apos;s daily spend total. Requires session authentication.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">Path Parameters</h3>
            <ParamTable
              params={[
                { name: "id", type: "string", required: true, description: "The transaction ID to reverse." },
              ]}
            />

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">Request Body</h3>
            <ParamTable
              params={[
                { name: "reason", type: "string", required: true, description: "Reason for the reversal." },
              ]}
            />

            <CodeBlock
              code={`// Request
POST /api/transactions/txn_abc123def456/reverse
{
  "reason": "Duplicate purchase detected by monitoring system"
}

// Response
{
  "id": "txn_abc123def456",
  "status": "reversed",
  "reversedAt": "2026-04-06T15:00:00Z",
  "reversalReason": "Duplicate purchase detected by monitoring system"
}`}
            />

            {/* PATCH /api/escalations/:id */}
            <SectionHeading id="resolve-escalation">
              <MethodBadge method="PATCH" />
              <span className="font-mono text-xl">/api/escalations/:id</span>
            </SectionHeading>
            <p className="text-slate-600 leading-relaxed">
              Approve or deny a pending escalation. When a transaction exceeds the human approval
              threshold, it creates an escalation that must be resolved by a human reviewer.
              Requires session authentication.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">Path Parameters</h3>
            <ParamTable
              params={[
                { name: "id", type: "string", required: true, description: "The escalation ID." },
              ]}
            />

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">Request Body</h3>
            <ParamTable
              params={[
                { name: "action", type: "string", required: true, description: '"approve" or "deny".' },
                { name: "note", type: "string", required: false, description: "Optional reviewer note." },
              ]}
            />

            <CodeTabs
              tabs={[
                {
                  label: "Node.js",
                  lang: "javascript",
                  code: `await fetch("https://api.sanctum.dev/v1/escalations/esc_789xyz", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    action: "approve",
    note: "Verified with engineering team. One-time infra purchase."
  })
});`,
                },
                {
                  label: "cURL",
                  lang: "bash",
                  code: `curl -X PATCH https://api.sanctum.dev/v1/escalations/esc_789xyz \\
  -H "Content-Type: application/json" \\
  -H "Cookie: next-auth.session-token=..." \\
  -d '{
    "action": "approve",
    "note": "Verified with engineering team. One-time infra purchase."
  }'`,
                },
              ]}
            />

            <CodeBlock
              code={`// Response
{
  "id": "esc_789xyz",
  "status": "approved",
  "resolvedBy": "user@company.com",
  "resolvedAt": "2026-04-06T16:00:00Z",
  "note": "Verified with engineering team. One-time infra purchase.",
  "transaction": {
    "id": "txn_def456",
    "status": "approved",
    "vendor": "GCP",
    "amount": 150000
  }
}`}
            />

            {/* SDKs */}
            <SectionHeading id="sdk">SDKs</SectionHeading>
            <p className="text-slate-600 leading-relaxed">
              Official SDKs handle authentication, retries, and type safety out of the box.
            </p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="p-5 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-700" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.998 0C5.366 0 0 5.367 0 12a11.992 11.992 0 008.005 11.318c.585.108.799-.254.799-.565 0-.28-.01-1.022-.015-2.005-3.338.726-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12.002-12" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Node.js / TypeScript</p>
                    <p className="text-xs text-slate-500">npm package</p>
                  </div>
                </div>
                <CodeBlock code={`npm install @sanctum/sdk`} />
                <CodeBlock
                  code={`import { Sanctum } from "@sanctum/sdk";

const sanctum = new Sanctum({
  agentToken: process.env.SANCTUM_AGENT_TOKEN,
});

const result = await sanctum.authorize({
  vendor: "AWS",
  amount: 4999,
  category: "cloud_compute",
  reasoning: "CI/CD pipeline compute",
});

if (result.approved) {
  // Proceed with purchase
}`}
                />
              </div>
              <div className="p-5 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-700" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Python</p>
                    <p className="text-xs text-slate-500">pip package</p>
                  </div>
                </div>
                <CodeBlock code={`pip install sanctum-sdk`} />
                <CodeBlock
                  code={`from sanctum import Sanctum

client = Sanctum(
    agent_token=os.environ["SANCTUM_AGENT_TOKEN"]
)

result = client.authorize(
    vendor="AWS",
    amount=4999,
    category="cloud_compute",
    reasoning="CI/CD pipeline compute",
)

if result.approved:
    # Proceed with purchase
    pass`}
                />
              </div>
            </div>

            {/* Sandbox Mode */}
            <SectionHeading id="sandbox">Sandbox Mode</SectionHeading>
            <p className="text-slate-600 leading-relaxed">
              Test your integration without recording real transactions. Pass{" "}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-indigo-600">sandbox: true</code>{" "}
              in your authorize request to simulate the full policy evaluation pipeline
              without creating a transaction record or affecting daily spend totals.
            </p>

            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                Sandbox Limitations
              </p>
              <ul className="mt-2 text-sm text-amber-700 space-y-1 list-disc list-inside">
                <li>No transaction ID is returned (the transaction is not persisted)</li>
                <li>Daily spend totals are not affected</li>
                <li>AI analysis is still performed for accurate risk scoring</li>
                <li>Sandbox requests count toward your rate limit</li>
              </ul>
            </div>

            <CodeBlock
              code={`{
  "agentToken": "eyJhbGciOiJIUzI1NiIs...",
  "vendor": "TestVendor",
  "amount": 999999,
  "category": "software",
  "reasoning": "Testing high-value transaction policy",
  "sandbox": true
}`}
            />

            {/* Rate Limits */}
            <SectionHeading id="rate-limits">Rate Limits</SectionHeading>
            <p className="text-slate-600 leading-relaxed">
              Rate limits are applied per-account and vary by plan. Limits reset every 60 seconds.
            </p>

            <div className="overflow-x-auto mt-4 border border-slate-200 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-4 py-3 font-semibold text-slate-700">Plan</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Requests / minute</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Agents</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">Developer</td>
                    <td className="px-4 py-3 text-slate-600">100 req/min</td>
                    <td className="px-4 py-3 text-slate-600">5 agents</td>
                    <td className="px-4 py-3 text-slate-500">Free tier</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">Team</td>
                    <td className="px-4 py-3 text-slate-600">1,000 req/min</td>
                    <td className="px-4 py-3 text-slate-600">50 agents</td>
                    <td className="px-4 py-3 text-slate-500">$49/mo</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">Enterprise</td>
                    <td className="px-4 py-3 text-slate-600">Unlimited</td>
                    <td className="px-4 py-3 text-slate-600">Unlimited</td>
                    <td className="px-4 py-3 text-slate-500">Custom pricing</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              Rate-limited responses return HTTP <code className="bg-slate-100 px-1 rounded">429</code> with
              a <code className="bg-slate-100 px-1 rounded">Retry-After</code> header indicating seconds to wait.
            </p>

            <CodeBlock
              code={`// Rate limit response headers
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1712419200
Retry-After: 42`}
            />

            {/* Error Codes */}
            <SectionHeading id="errors">Error Codes</SectionHeading>
            <p className="text-slate-600 leading-relaxed mb-4">
              All errors return a consistent JSON format with an error code, message, and HTTP status.
            </p>

            <CodeBlock
              code={`{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "The agent token is invalid or has been revoked.",
    "status": 401
  }
}`}
            />

            <div className="overflow-x-auto mt-4 border border-slate-200 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-4 py-3 font-semibold text-slate-700">HTTP</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Code</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { http: "400", code: "INVALID_REQUEST", desc: "Missing or invalid request body parameters." },
                    { http: "401", code: "INVALID_TOKEN", desc: "Agent token is invalid, expired, or revoked." },
                    { http: "401", code: "UNAUTHORIZED", desc: "Session authentication required but not provided." },
                    { http: "403", code: "AGENT_PAUSED", desc: "The agent is paused and cannot authorize transactions." },
                    { http: "403", code: "AGENT_REVOKED", desc: "The agent has been permanently revoked." },
                    { http: "404", code: "NOT_FOUND", desc: "The requested resource does not exist." },
                    { http: "409", code: "ALREADY_REVERSED", desc: "Transaction has already been reversed." },
                    { http: "409", code: "ALREADY_RESOLVED", desc: "Escalation has already been approved or denied." },
                    { http: "422", code: "INVALID_AMOUNT", desc: "Amount must be a positive integer (cents)." },
                    { http: "422", code: "INVALID_CATEGORY", desc: "Category is not recognized." },
                    { http: "429", code: "RATE_LIMITED", desc: "Too many requests. Check Retry-After header." },
                    { http: "500", code: "INTERNAL_ERROR", desc: "Unexpected server error. Contact support." },
                  ].map((e) => (
                    <tr key={e.code} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            e.http.startsWith("4")
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {e.http}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{e.code}</td>
                      <td className="px-4 py-3 text-slate-600">{e.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="mt-20 pt-8 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">
                    Need help?{" "}
                    <a href="mailto:support@sanctum.dev" className="text-indigo-600 hover:underline">
                      support@sanctum.dev
                    </a>
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                    Home
                  </Link>
                  <Link href="/login" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                    Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
