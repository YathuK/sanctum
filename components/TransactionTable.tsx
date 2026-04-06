"use client";

import Link from "next/link";
import StatusBadge from "./StatusBadge";

interface Transaction {
  _id: string;
  agentName?: string;
  vendor: string;
  amount: number;
  currency: string;
  category: string;
  status: string;
  createdAt: string;
}

export default function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No transactions yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Agent</th>
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Vendor</th>
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Amount</th>
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Status</th>
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.map((tx) => (
            <Link key={tx._id} href={`/transactions/${tx._id}`} className="contents">
              <tr className="hover:bg-slate-50 cursor-pointer transition-colors">
                <td className="py-3 px-4 text-sm font-medium text-slate-900">{tx.agentName || "—"}</td>
                <td className="py-3 px-4 text-sm text-slate-600">{tx.vendor}</td>
                <td className="py-3 px-4 text-sm font-medium text-slate-900">
                  ${(tx.amount / 100).toFixed(2)} {tx.currency}
                </td>
                <td className="py-3 px-4"><StatusBadge status={tx.status} /></td>
                <td className="py-3 px-4 text-sm text-slate-500">
                  {new Date(tx.createdAt).toLocaleString()}
                </td>
              </tr>
            </Link>
          ))}
        </tbody>
      </table>
    </div>
  );
}
