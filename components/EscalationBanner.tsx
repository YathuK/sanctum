import Link from "next/link";

export default function EscalationBanner({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <Link href="/escalations">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between mb-6 hover:bg-amber-100 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {count} pending escalation{count > 1 ? "s" : ""} require your approval
            </p>
            <p className="text-xs text-amber-600">Click to review and approve or deny</p>
          </div>
        </div>
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
