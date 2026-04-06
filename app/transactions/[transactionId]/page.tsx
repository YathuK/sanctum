"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import StatusBadge from "@/components/StatusBadge";

export default function TransactionDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const txId = params.transactionId as string;
  const [tx, setTx] = useState<any>(null);
  const [reversing, setReversing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch(`/api/transactions?id=${txId}`)
        .then((r) => r.json())
        .then((d) => {
          const found = (d.transactions || [])[0] || null;
          setTx(found);
        });
    }
  }, [status, txId]);

  const reverse = async () => {
    setReversing(true);
    const res = await fetch(`/api/transactions/${txId}/reverse`, { method: "POST" });
    const data = await res.json();
    if (data.status === "reversed") {
      setTx({ ...tx, status: "reversed" });
    }
    setReversing(false);
  };

  if (!tx) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const canReverse = tx.status === "approved" &&
    (Date.now() - new Date(tx.createdAt).getTime()) < 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-64 p-8">
        <button onClick={() => router.push("/transactions")} className="text-sm text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Transactions
        </button>

        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Transaction Detail</h1>
            <StatusBadge status={tx.status} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-500">Agent</p>
                <p className="font-medium text-slate-900">{tx.agentName || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Vendor</p>
                <p className="font-medium text-slate-900">{tx.vendor}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Amount</p>
                <p className="font-medium text-slate-900">${(tx.amount / 100).toFixed(2)} {tx.currency}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Category</p>
                <p className="font-medium text-slate-900">{tx.category}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Time</p>
                <p className="font-medium text-slate-900">{new Date(tx.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Policy Rule</p>
                <p className="font-medium text-slate-900">{tx.policyRuleApplied || "—"}</p>
              </div>
            </div>
          </div>

          {tx.agentReasoning && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Agent Reasoning</h3>
              <p className="text-sm text-slate-600">{tx.agentReasoning}</p>
            </div>
          )}

          {tx.claudeAnalysis && (
            <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6 mb-6">
              <h3 className="text-sm font-semibold text-indigo-900 mb-2">Claude Analysis</h3>
              <p className="text-sm text-indigo-700">{tx.claudeAnalysis}</p>
            </div>
          )}

          {tx.humanApprovedBy && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Human Approval</h3>
              <p className="text-sm text-slate-600">Approved by {tx.humanApprovedBy} at {new Date(tx.humanApprovedAt).toLocaleString()}</p>
            </div>
          )}

          {canReverse && (
            <button
              onClick={reverse}
              disabled={reversing}
              className="bg-red-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {reversing ? "Reversing..." : "Reverse Transaction"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
