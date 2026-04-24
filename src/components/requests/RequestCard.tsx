import { ChevronRight, Palmtree, Ticket } from "lucide-react";
import { StatusBadge } from "../ui/StatusBadge";
import { getStatusTone, fmt } from "./utils";
import type { Request } from "./RequestTypes";

export function RequestCard({
  req,
  onClick,
}: {
  req: Request;
  onClick: (r: Request) => void;
}) {
  const isLeave = req.type === "LEAVE";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(req)}
      onKeyDown={(e) => e.key === "Enter" && onClick(req)}
      className="group cursor-pointer rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:border-indigo-100 hover:bg-gray-50 hover:shadow-lg hover:shadow-indigo-500/5 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 dark:border-gray-800/60 dark:bg-gray-900 dark:hover:bg-gray-800/50"
    >
      {/* ── Mobile layout ─────────────────────────────────────── */}
      <div className="p-4 md:hidden">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${isLeave
              ? "bg-blue-50 text-blue-500 dark:bg-blue-950/40"
              : "bg-orange-50 text-orange-500 dark:bg-orange-950/40"
              }`}
          >
            {isLeave ? <Palmtree className="h-5 w-5" /> : <Ticket className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${isLeave ? "text-blue-500" : "text-orange-500"
                  }`}
              >
                {req.type}
              </span>
              <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="text-[10px] font-semibold text-gray-400">
                {fmt(req.timestamp)}
              </span>
            </div>
            <p className="mt-1 text-sm font-bold leading-snug text-gray-900 dark:text-white">
              {req.details}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <StatusBadge label={req.status} tone={getStatusTone(req.status)} />
          <ChevronRight className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-400" />
        </div>
      </div>

      {/* ── Desktop layout (md+) ──────────────────────────────── */}
      <div className="hidden md:flex md:items-center md:gap-4 md:p-5">
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 ${isLeave
            ? "bg-blue-50 text-blue-500 dark:bg-blue-950/40"
            : "bg-orange-50 text-orange-500 dark:bg-orange-950/40"
            }`}
        >
          {isLeave ? <Palmtree className="h-5 w-5" /> : <Ticket className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${isLeave ? "text-blue-500" : "text-orange-500"
                }`}
            >
              {req.type}
            </span>
            <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span className="text-[10px] font-semibold text-gray-400">{fmt(req.timestamp)}</span>
          </div>
          <p className="mt-0.5 truncate text-sm font-bold text-gray-900 dark:text-white">
            {req.details}
          </p>
        </div>
        <StatusBadge label={req.status} tone={getStatusTone(req.status)} />
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-indigo-400" />
      </div>
    </div>
  );
}
