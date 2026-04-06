import Link from "next/link";
import StatusBadge from "./StatusBadge";

interface AgentCardProps {
  agent: {
    _id: string;
    name: string;
    status: string;
    spentToday: number;
    policy: { maxPerDay: number; currency: string };
    createdAt: string;
  };
}

export default function AgentCard({ agent }: AgentCardProps) {
  const pct = agent.policy.maxPerDay > 0
    ? Math.min((agent.spentToday / agent.policy.maxPerDay) * 100, 100)
    : 0;

  return (
    <Link href={`/agents/${agent._id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900">{agent.name}</h3>
          <StatusBadge status={agent.status} />
        </div>
        <div className="mb-3">
          <div className="flex justify-between text-sm text-slate-500 mb-1">
            <span>Spent today</span>
            <span>
              ${(agent.spentToday / 100).toFixed(2)} / ${(agent.policy.maxPerDay / 100).toFixed(2)} {agent.policy.currency}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-indigo-600"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Created {new Date(agent.createdAt).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
