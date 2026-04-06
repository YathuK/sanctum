const styles: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  blocked: "bg-red-100 text-red-700",
  pending_approval: "bg-amber-100 text-amber-700",
  pending: "bg-amber-100 text-amber-700",
  reversed: "bg-slate-100 text-slate-600",
  active: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
  expired: "bg-slate-100 text-slate-600",
  denied: "bg-red-100 text-red-700",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
