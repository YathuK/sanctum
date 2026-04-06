"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TransactionTable from "@/components/TransactionTable";

export default function TransactionsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [agents, setAgents] = useState<any[]>([]);
  const [agentFilter, setAgentFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/agents").then((r) => r.json()).then(setAgents);
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (agentFilter) params.set("agentId", agentFilter);
      params.set("page", page.toString());
      params.set("limit", "25");

      fetch(`/api/transactions?${params}`)
        .then((r) => r.json())
        .then((d) => {
          setTransactions(d.transactions || []);
          setTotal(d.total || 0);
          setPages(d.pages || 1);
          setLoading(false);
        });
    }
  }, [status, statusFilter, agentFilter, page]);

  const exportCSV = () => {
    const headers = "Agent,Vendor,Amount,Currency,Category,Status,Time\n";
    const rows = transactions.map((t: any) =>
      `"${t.agentName}","${t.vendor}",${(t.amount / 100).toFixed(2)},${t.currency},"${t.category}","${t.status}","${t.createdAt}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
            <p className="text-sm text-slate-500 mt-1">{total} total transactions</p>
          </div>
          <button
            onClick={exportCSV}
            className="border border-slate-300 text-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Export CSV
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All statuses</option>
            <option value="approved">Approved</option>
            <option value="blocked">Blocked</option>
            <option value="pending_approval">Pending</option>
            <option value="reversed">Reversed</option>
          </select>

          <select
            value={agentFilter}
            onChange={(e) => { setAgentFilter(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All agents</option>
            {agents.map((a: any) => (
              <option key={a._id} value={a._id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <TransactionTable transactions={transactions} />
          )}
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">Page {page} of {pages}</span>
            <button
              onClick={() => setPage(Math.min(pages, page + 1))}
              disabled={page === pages}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
