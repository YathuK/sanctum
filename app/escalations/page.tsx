"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import StatusBadge from "@/components/StatusBadge";

export default function EscalationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/escalations")
        .then((r) => r.json())
        .then((data) => {
          setEscalations(data.escalations || data || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  const handleAction = async (escalationId: string, action: "approve" | "deny") => {
    const res = await fetch(`/api/escalations/${escalationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setEscalations((prev) =>
        prev.map((e) =>
          e._id === escalationId
            ? { ...e, status: action === "approve" ? "approved" : "denied", respondedAt: new Date().toISOString() }
            : e
        )
      );
    }
  };

  const pending = escalations.filter((e) => e.status === "pending");
  const resolved = escalations.filter((e) => e.status !== "pending");

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Escalations</h1>
          <p className="text-sm text-slate-500 mt-1">Review and approve agent transaction requests</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Pending Approvals</h2>
              {pending.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-500">No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.map((esc) => (
                    <div key={esc._id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold text-slate-900">{esc.agentName || "Agent"}</span>
                            <span className="text-sm text-slate-500">wants to spend</span>
                            <span className="font-bold text-slate-900">${(esc.requestedAmount / 100).toFixed(2)} {esc.currency}</span>
                            <span className="text-sm text-slate-500">at</span>
                            <span className="font-medium text-slate-900">{esc.vendor}</span>
                          </div>
                          <p className="text-sm text-slate-500">{esc.reason}</p>
                          <p className="text-xs text-slate-400 mt-1">{new Date(esc.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleAction(esc._id, "approve")}
                            className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(esc._id, "deny")}
                            className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors"
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {resolved.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">History</h2>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Agent</th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Vendor</th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Amount</th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Status</th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Resolved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {resolved.map((esc) => (
                        <tr key={esc._id}>
                          <td className="py-3 px-4 text-sm font-medium text-slate-900">{esc.agentName || "Agent"}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{esc.vendor}</td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-900">${(esc.requestedAmount / 100).toFixed(2)}</td>
                          <td className="py-3 px-4"><StatusBadge status={esc.status} /></td>
                          <td className="py-3 px-4 text-sm text-slate-500">{esc.respondedAt ? new Date(esc.respondedAt).toLocaleString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
