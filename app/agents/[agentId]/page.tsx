"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import StatusBadge from "@/components/StatusBadge";
import TransactionTable from "@/components/TransactionTable";
import ApiPlayground from "@/components/ApiPlayground";

export default function AgentDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const agentId = params.agentId as string;
  const [agent, setAgent] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [newToken, setNewToken] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch(`/api/agents/${agentId}`).then((r) => r.json()).then(setAgent);
      fetch(`/api/transactions?agentId=${agentId}&limit=20`).then((r) => r.json()).then((d) => setTransactions(d.transactions || []));
    }
  }, [status, agentId]);

  const toggleStatus = async () => {
    const newStatus = agent.status === "active" ? "suspended" : "active";
    const res = await fetch(`/api/agents/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    setAgent(data);
  };

  const regenerateToken = async () => {
    const res = await fetch(`/api/agents/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerateToken: true }),
    });
    const data = await res.json();
    if (data.token) {
      setNewToken(data.token);
      setAgent(data);
    }
  };

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="mb-8">
          <button onClick={() => router.push("/agents")} className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Agents
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{agent.name}</h1>
            <StatusBadge status={agent.status} />
          </div>
          {agent.description && <p className="text-sm text-slate-500 mt-1">{agent.description}</p>}
        </div>

        {newToken && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-amber-800 mb-2">New token generated. Save it now — it will not be shown again.</p>
            <div className="bg-slate-900 rounded-lg p-3 mb-2">
              <code className="text-green-400 text-xs break-all">{newToken}</code>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(newToken); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              {copied ? "Copied!" : "Copy token"}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Policy</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Max per transaction</span>
                <span className="font-medium text-slate-900">${(agent.policy.maxPerTransaction / 100).toFixed(2)} {agent.policy.currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Max per day</span>
                <span className="font-medium text-slate-900">${(agent.policy.maxPerDay / 100).toFixed(2)} {agent.policy.currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Requires approval above</span>
                <span className="font-medium text-slate-900">${(agent.policy.requiresApprovalAbove / 100).toFixed(2)} {agent.policy.currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Approved categories</span>
                <span className="font-medium text-slate-900">{agent.policy.approvedCategories.join(", ") || "All"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Blocked vendors</span>
                <span className="font-medium text-slate-900">{agent.policy.blockedVendors.join(", ") || "None"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Spent today</span>
                <span className="font-medium text-slate-900">${(agent.spentToday / 100).toFixed(2)} {agent.policy.currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Expires</span>
                <span className="font-medium text-slate-900">{new Date(agent.expiresAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={toggleStatus}
                className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  agent.status === "active"
                    ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                    : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                }`}
              >
                {agent.status === "active" ? "Suspend Agent" : "Reactivate Agent"}
              </button>
              <button
                onClick={regenerateToken}
                className="w-full bg-slate-100 text-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                Regenerate Token
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <ApiPlayground />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Transaction History</h2>
          </div>
          <TransactionTable transactions={transactions} />
        </div>
      </main>
    </div>
  );
}
