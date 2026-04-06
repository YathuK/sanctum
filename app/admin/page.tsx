"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    violet: "bg-violet-50 text-violet-600",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-2">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function AdminPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [users, setUsers] = useState<any>(null);
  const [tab, setTab] = useState<"overview" | "users">("overview");
  const [search, setSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/admin?section=overview")
        .then((r) => {
          if (r.status === 403) { setError("Access denied. Admin only."); return null; }
          return r.json();
        })
        .then((d) => { if (d) setData(d); setLoading(false); })
        .catch(() => { setError("Failed to load"); setLoading(false); });
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated" && tab === "users") {
      const params = new URLSearchParams({ section: "users", page: userPage.toString(), limit: "25" });
      if (search) params.set("search", search);
      fetch(`/api/admin?${params}`)
        .then((r) => r.json())
        .then(setUsers);
    }
  }, [status, tab, userPage, search]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md text-center">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-slate-900 mb-2">{error}</p>
          <Link href="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const d = data;
  const maxTxDay = Math.max(...(d?.transactions?.byDay?.map((x: any) => x.count) || [1]));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="font-bold text-slate-900">Sanctum</span>
            </Link>
            <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">ADMIN</span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setTab("overview")} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${tab === "overview" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}>
              Overview
            </button>
            <button onClick={() => setTab("users")} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${tab === "users" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}>
              Users
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {tab === "overview" && d && (
          <>
            {/* Top Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              <StatCard label="Total Users" value={d.users.total} sub={`+${d.users.today} today`} color="indigo" />
              <StatCard label="Users This Week" value={d.users.thisWeek} color="blue" />
              <StatCard label="Users This Month" value={d.users.thisMonth} color="violet" />
              <StatCard label="Active Agents" value={d.agents.active} sub={`${d.agents.total} total`} color="green" />
              <StatCard label="Total Transactions" value={d.transactions.total.toLocaleString()} sub={`${d.transactions.today} today`} color="amber" />
              <StatCard label="Total Volume" value={`$${(d.transactions.totalVolume / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color="green" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Transaction Volume Chart */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Transactions — Last 14 Days</h3>
                <div className="space-y-2">
                  {d.transactions.byDay.map((day: any) => (
                    <div key={day._id} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-20 flex-shrink-0">{day._id.slice(5)}</span>
                      <div className="flex-1 flex gap-1">
                        <div
                          className="h-6 bg-green-500 rounded-l-md flex items-center justify-end pr-1"
                          style={{ width: `${maxTxDay > 0 ? (day.approved / maxTxDay) * 100 : 0}%`, minWidth: day.approved > 0 ? "8px" : "0" }}
                        >
                          {day.approved > 3 && <span className="text-[10px] text-white font-medium">{day.approved}</span>}
                        </div>
                        <div
                          className="h-6 bg-red-400 rounded-r-md flex items-center justify-end pr-1"
                          style={{ width: `${maxTxDay > 0 ? (day.blocked / maxTxDay) * 100 : 0}%`, minWidth: day.blocked > 0 ? "8px" : "0" }}
                        >
                          {day.blocked > 3 && <span className="text-[10px] text-white font-medium">{day.blocked}</span>}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 w-16 text-right">${(day.volume / 100).toFixed(0)}</span>
                    </div>
                  ))}
                  {d.transactions.byDay.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-8">No transaction data yet</p>
                  )}
                </div>
                <div className="flex gap-4 mt-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded" /> Approved</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-400 rounded" /> Blocked</div>
                </div>
              </div>

              {/* Status Breakdown + Plans */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Transaction Status</h3>
                  <div className="space-y-3">
                    {d.transactions.byStatus.map((s: any) => {
                      const colors: Record<string, string> = { approved: "bg-green-500", blocked: "bg-red-500", pending_approval: "bg-amber-500", reversed: "bg-slate-400" };
                      return (
                        <div key={s._id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600 capitalize">{s._id?.replace("_", " ")}</span>
                            <span className="font-medium text-slate-900">{s.count}</span>
                          </div>
                          <MiniBar value={s.count} max={d.transactions.total} color={colors[s._id] || "bg-slate-300"} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Plan Distribution</h3>
                  <div className="space-y-3">
                    {d.users.planDistribution.map((p: any) => {
                      const colors: Record<string, string> = { developer: "bg-slate-400", team: "bg-indigo-500", enterprise: "bg-violet-600" };
                      return (
                        <div key={p._id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600 capitalize">{p._id}</span>
                            <span className="font-medium text-slate-900">{p.count}</span>
                          </div>
                          <MiniBar value={p.count} max={d.users.total} color={colors[p._id] || "bg-slate-300"} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Vendors */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Top Vendors by Volume</h3>
                {d.transactions.topVendors.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left text-xs font-medium text-slate-500 py-2">Vendor</th>
                        <th className="text-right text-xs font-medium text-slate-500 py-2">Transactions</th>
                        <th className="text-right text-xs font-medium text-slate-500 py-2">Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.transactions.topVendors.map((v: any) => (
                        <tr key={v._id} className="border-b border-slate-50">
                          <td className="py-2 text-sm font-medium text-slate-900">{v._id}</td>
                          <td className="py-2 text-sm text-slate-600 text-right">{v.count}</td>
                          <td className="py-2 text-sm font-medium text-slate-900 text-right">${(v.volume / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-6">No vendor data yet</p>
                )}
              </div>

              {/* Recent Signups */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Signups</h3>
                <div className="space-y-2">
                  {d.users.recentSignups.map((u: any) => (
                    <div key={u._id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{u.email}</p>
                        <p className="text-xs text-slate-400">{u.company || "No company"}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.plan === "enterprise" ? "bg-violet-100 text-violet-700" :
                          u.plan === "team" ? "bg-indigo-100 text-indigo-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>{u.plan}</span>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(u.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {d.users.recentSignups.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-6">No users yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pending Alert */}
            {d.escalations.pending > 0 && (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-amber-800">{d.escalations.pending} pending escalation{d.escalations.pending > 1 ? "s" : ""} across all users</p>
              </div>
            )}
          </>
        )}

        {tab === "users" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">All Users</h2>
              <input
                type="text"
                placeholder="Search by email or company..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setUserPage(1); }}
                className="border border-slate-300 rounded-xl px-4 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase py-3 px-4">Email</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase py-3 px-4">Company</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase py-3 px-4">Plan</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase py-3 px-4">Agents</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase py-3 px-4">Transactions</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase py-3 px-4">Volume</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase py-3 px-4">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users?.users?.map((u: any) => (
                    <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-slate-900">{u.email}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{u.company || "—"}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.plan === "enterprise" ? "bg-violet-100 text-violet-700" :
                          u.plan === "team" ? "bg-indigo-100 text-indigo-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>{u.plan}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900 text-right font-medium">{u.agentCount}</td>
                      <td className="py-3 px-4 text-sm text-slate-900 text-right font-medium">{u.transactionCount}</td>
                      <td className="py-3 px-4 text-sm text-slate-900 text-right font-medium">
                        ${(u.transactionVolume / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500 text-right">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {(!users?.users || users.users.length === 0) && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                        {search ? "No users match your search" : "No users yet"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {users && users.pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setUserPage(Math.max(1, userPage - 1))}
                  disabled={userPage === 1}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-500">
                  Page {userPage} of {users.pages} ({users.total} users)
                </span>
                <button
                  onClick={() => setUserPage(Math.min(users.pages, userPage + 1))}
                  disabled={userPage === users.pages}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
