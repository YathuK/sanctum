"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

const CATEGORIES = ["software", "travel", "procurement", "marketing", "other"];

export default function NewAgentPage() {
  const { status } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxPerTransaction, setMaxPerTransaction] = useState("");
  const [maxPerDay, setMaxPerDay] = useState("");
  const [approvedCategories, setApprovedCategories] = useState<string[]>([]);
  const [blockedVendors, setBlockedVendors] = useState("");
  const [requiresApprovalAbove, setRequiresApprovalAbove] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const toggleCategory = (cat: string) => {
    setApprovedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        policy: {
          maxPerTransaction: Math.round(parseFloat(maxPerTransaction) * 100),
          maxPerDay: Math.round(parseFloat(maxPerDay) * 100),
          approvedCategories,
          blockedVendors: blockedVendors.split(",").map((v) => v.trim()).filter(Boolean),
          requiresApprovalAbove: requiresApprovalAbove
            ? Math.round(parseFloat(requiresApprovalAbove) * 100)
            : 999999999,
          currency: "CAD",
        },
        expiresAt,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.token) {
      setToken(data.token);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (token) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="ml-64 p-8">
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Agent Created</h1>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-amber-800">
                  Save this token. It will not be shown again.
                </p>
              </div>

              <div className="bg-slate-900 rounded-xl p-4 mb-4">
                <code className="text-green-400 text-sm break-all">{token}</code>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyToken}
                  className="bg-indigo-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  {copied ? "Copied!" : "Copy Token"}
                </button>
                <button
                  onClick={() => router.push("/agents")}
                  className="border border-slate-300 text-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Back to Agents
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="max-w-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Create Agent</h1>
            <p className="text-sm text-slate-500 mt-1">Define an identity and spending policy for your AI agent</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Agent Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Procurement Bot"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What does this agent do?"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Spend per Transaction (CAD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={maxPerTransaction}
                  onChange={(e) => setMaxPerTransaction(e.target.value)}
                  required
                  placeholder="500.00"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Spend per Day (CAD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={maxPerDay}
                  onChange={(e) => setMaxPerDay(e.target.value)}
                  required
                  placeholder="2000.00"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Approved Categories</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      approvedCategories.includes(cat)
                        ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-300"
                        : "bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200"
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Blocked Vendors</label>
              <input
                type="text"
                value={blockedVendors}
                onChange={(e) => setBlockedVendors(e.target.value)}
                placeholder="Comma separated, e.g. Casino.com, Gambling Inc"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Requires Approval Above (CAD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={requiresApprovalAbove}
                  onChange={(e) => setRequiresApprovalAbove(e.target.value)}
                  placeholder="1000.00"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-xl px-4 py-3 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating..." : "Create Agent"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
