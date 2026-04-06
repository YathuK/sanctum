"use client";

import { useState } from "react";

const CATEGORIES = ["software", "travel", "procurement", "marketing", "other"];

export default function ApiPlayground({ agentToken }: { agentToken?: string }) {
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("software");
  const [reasoning, setReasoning] = useState("");
  const [result, setResult] = useState<object | null>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(agentToken || "");

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentToken: token,
          vendor,
          amount: Math.round(parseFloat(amount) * 100),
          currency: "CAD",
          category,
          reasoning,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Test Authorization</h3>
      <p className="text-sm text-slate-500 mb-4">
        Simulate an agent transaction against the /api/authorize endpoint.
      </p>

      <div className="space-y-4">
        {!agentToken && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Agent Token</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste agent JWT token"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g. AWS"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (CAD)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 49.99"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Reasoning</label>
          <textarea
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            rows={3}
            placeholder="Why does the agent want to make this purchase?"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={run}
          disabled={loading || !vendor || !amount}
          className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Testing..." : "Test Transaction"}
        </button>

        {result && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Response</label>
            <pre className="bg-slate-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
