import { ChevronRight, Palmtree, Ticket, CheckCircle2, Timer, Ban } from "lucide-react";
import { StatusBadge } from "../ui/StatusBadge";
import { getStatusTone, fmt } from "./utils";
import type { Request } from "./RequestTypes";

function PizzaTracker({ req }: { req: Request }) {
  const isPending = req.status === "PENDING";
  const isApproved = req.status === "APPROVED";
  const isRejected = req.status === "REJECTED" || req.status === "CANCELLED";
  const isFinal = isApproved || isRejected;

  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="flex items-center gap-1 px-1">
        <div className="h-1.5 flex-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
        <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${isPending || isFinal ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'bg-gray-100 dark:bg-gray-800'}`} />
        <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${isFinal ? (isRejected ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]') : 'bg-gray-100 dark:bg-gray-800'}`} />
      </div>
      
      <div className="flex justify-between px-0.5">
        <div className="flex flex-col items-start flex-1 gap-1">
          <div className="flex items-start gap-1 text-[9px] font-black uppercase tracking-tighter text-emerald-600 whitespace-nowrap text-left leading-tight">
            <CheckCircle2 className="h-2.5 w-2.5 shrink-0 mt-[1px]" />
            <span>Submitted</span>
          </div>
        </div>

        <div className="flex flex-col items-center flex-1 gap-1 px-1">
          <div className={`flex items-start justify-center gap-1 text-[9px] font-black uppercase tracking-tighter whitespace-nowrap text-center leading-tight ${isPending ? 'text-amber-600 animate-pulse' : isFinal ? 'text-amber-600/50' : 'text-gray-300 dark:text-gray-700'}`}>
            <Timer className="h-2.5 w-2.5 shrink-0 mt-[1px]" />
            <span>
              {isPending ? (
                <>
                  <span className="md:hidden">Pending</span>
                  <span className="hidden md:inline">{`Pending ${req.pendingApproverName || 'Manager'}`}</span>
                </>
              ) : 'Review'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end flex-1 gap-1">
          <div className={`flex items-start justify-end gap-1 text-[9px] font-black uppercase tracking-tighter whitespace-nowrap text-right leading-tight ${isFinal ? (isRejected ? 'text-rose-600' : 'text-emerald-600') : 'text-gray-300 dark:text-gray-700'}`}>
            {isRejected ? <Ban className="h-2.5 w-2.5 shrink-0 mt-[1px]" /> : <CheckCircle2 className="h-2.5 w-2.5 shrink-0 mt-[1px]" />}
            <span>
              {isApproved ? (
                <>
                  <span className="md:hidden">Approved</span>
                  <span className="hidden md:inline">{`Approved by ${req.actionByName || 'Admin'}`}</span>
                </>
              ) : isRejected ? req.status : 'Final'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${isLeave
                ? "bg-blue-50 text-blue-500 dark:bg-blue-950/40"
                : "bg-orange-50 text-orange-500 dark:bg-orange-950/40"
                }`}
            >
              {isLeave ? <Palmtree className="h-5 w-5" /> : <Ticket className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span
                  className={`text-[9px] font-black uppercase tracking-widest ${isLeave ? "text-blue-500" : "text-orange-500"
                    }`}
                >
                  {req.type}
                </span>
                <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="text-[9px] font-semibold text-gray-400">
                  {fmt(req.timestamp)}
                </span>
              </div>
              <p className="mt-1 text-sm font-bold leading-tight text-gray-900 dark:text-white line-clamp-2">
                {req.details}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge label={req.status} tone={getStatusTone(req.status)} />
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </div>
        </div>
        
        <PizzaTracker req={req} />
      </div>

      {/* ── Desktop layout (md+) ──────────────────────────────── */}
      <div className="hidden md:block md:p-5">
        <div className="flex items-center gap-4">
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
          <div className="flex items-center gap-3">
             <StatusBadge label={req.status} tone={getStatusTone(req.status)} />
             <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-indigo-400" />
          </div>
        </div>
        
        <div className="mt-4 max-w-sm ml-14">
          <PizzaTracker req={req} />
        </div>
      </div>
    </div>
  );
}
