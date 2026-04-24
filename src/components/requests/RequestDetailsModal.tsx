import { AlertCircle, AlertTriangle, Ban, Calendar, CheckCircle2, Clock, Palmtree, SunDim, Sunset, Ticket, XCircle } from "lucide-react";
import { AppModal } from "../ui/AppModal";
import { useAppToast } from "../ui/ToastProvider";
import { useRevokeLeave } from "../../hooks/queries/useLeaves";
import { fmt, fmtTime } from "./utils";
import type { Request } from "./RequestTypes";

const statusConfig: Record<
  string,
  { icon: React.ReactNode; bg: string; text: string; border: string; label: string }
> = {
  APPROVED: {
    icon: <CheckCircle2 className="h-6 w-6" />,
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800/60",
    label: "Approved",
  },
  PENDING: {
    icon: <AlertTriangle className="h-6 w-6" />,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800/60",
    label: "Pending Review",
  },
  REJECTED: {
    icon: <XCircle className="h-6 w-6" />,
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800/60",
    label: "Rejected",
  },
  CANCELLED: {
    icon: <Ban className="h-6 w-6" />,
    bg: "bg-gray-50 dark:bg-gray-800/40",
    text: "text-gray-500 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-700/60",
    label: "Cancelled",
  },
  REVOKED: {
    icon: <AlertCircle className="h-6 w-6" />,
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800/60",
    label: "Revoked by Admin",
  },
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {label}
      </span>
      <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

export function RequestDetailsModal({
  request,
  onClose,
}: {
  request: Request;
  onClose: () => void;
}) {
  const { pushToast } = useAppToast();
  const revokeMutation = useRevokeLeave();
  const isLeave = request.type === "LEAVE";
  const cfg = statusConfig[request.status] ?? statusConfig["PENDING"];
  const m = request.metadata ?? {};

  const handleRevoke = async () => {
    try {
      await revokeMutation.mutateAsync({ leaveId: request.id, reason: "Revoked by user" });
      pushToast({ title: "Success", message: "Leave request revoked.", tone: "success" });
      onClose();
    } catch (err: any) {
      pushToast({ title: "Error", message: err.response?.data?.message || "Failed to revoke", tone: "error" });
    }
  };

  return (
    <AppModal
      isOpen={true}
      onClose={onClose}
      title={isLeave ? "Leave Details" : "Gatepass Details"}
      size="lg"
    >
      <div className="space-y-5 pb-4 pt-2">

        {/* ── Status hero ─────────────────────────────────────── */}
        <div
          className={`flex items-center gap-4 rounded-2xl border p-4 ${cfg.bg} ${cfg.border}`}
        >
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${cfg.bg} ${cfg.text}`}>
            {cfg.icon}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Current Status
            </p>
            <p className={`text-xl font-black ${cfg.text}`}>{cfg.label}</p>
          </div>
        </div>

        {/* ── Type banner ─────────────────────────────────────── */}
        <div
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${isLeave
            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
            : "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300"
            }`}
        >
          {isLeave ? <Palmtree className="h-5 w-5 flex-shrink-0" /> : <Ticket className="h-5 w-5 flex-shrink-0" />}
          <span className="text-sm font-black uppercase tracking-wider">
            {isLeave ? "Leave Request" : "Gatepass Request"}
          </span>
        </div>

        {/* ── Meta grid ───────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800/60 dark:bg-gray-800/30">
          {isLeave ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailRow label="Leave Type" value={m.leaveTypeName ?? "—"} />
              <DetailRow
                label="Applied On"
                value={fmt(request.timestamp, { day: "numeric", month: "long", year: "numeric" })}
              />
              <DetailRow
                label="Start Date"
                value={
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                    {m.startDate ?? "—"}
                  </span>
                }
              />
              <DetailRow
                label="End Date"
                value={
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                    {m.endDate ?? "—"}
                  </span>
                }
              />
              {m.halfDay && (
                <DetailRow
                  label="Half Day"
                  value={
                    <span className="flex items-center gap-1.5">
                      {m.halfType === "FIRST" ? (
                        <SunDim className="h-3.5 w-3.5 text-amber-400" />
                      ) : (
                        <Sunset className="h-3.5 w-3.5 text-orange-400" />
                      )}
                      {m.halfType === "FIRST" ? "First Half" : "Second Half"}
                    </span>
                  }
                />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailRow label="Pass Type" value={m.gatepassType ?? "—"} />
              <DetailRow
                label="Applied On"
                value={fmt(request.timestamp, { day: "numeric", month: "long", year: "numeric" })}
              />
              <DetailRow
                label="Exit Time"
                value={
                  m.requestedOutTime ? (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-indigo-400" />
                      {fmtTime(m.requestedOutTime)}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
              <DetailRow
                label="Return Time"
                value={
                  m.requestedInTime ? (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-indigo-400" />
                      {fmtTime(m.requestedInTime)}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
          )}
        </div>

        {/* ── Reason / details ────────────────────────────────── */}
        {(m.reason || request.details) && (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800/60 dark:bg-gray-800/30">
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Reason / Details
            </p>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {m.reason || request.details}
            </p>
          </div>
        )}

        {/* ── Actions ────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {request.status === "APPROVED" && isLeave && (
            <button
              type="button"
              disabled={revokeMutation.isPending}
              onClick={handleRevoke}
              className="w-full min-h-[48px] rounded-2xl border border-rose-200 bg-rose-50 py-3 text-sm font-black text-rose-600 transition-all hover:bg-rose-600 hover:text-white disabled:opacity-50 dark:border-rose-900/50 dark:bg-rose-950/20"
            >
              {revokeMutation.isPending ? "Revoking..." : "Revoke Request"}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[48px] rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-500 transition-all hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </AppModal>
  );
}
