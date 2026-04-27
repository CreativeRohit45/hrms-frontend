import { useState } from "react";
import { AlertCircle, AlertTriangle, Ban, Calendar, CheckCircle2, Clock, Palmtree, SunDim, Sunset, Ticket, XCircle } from "lucide-react";
import { AppModal } from "../ui/AppModal";
import { useAppToast } from "../ui/ToastProvider";
import { useCancelLeave, useRevokeLeave } from "../../hooks/queries/useLeaves";
import { useCancelGatepass } from "../../hooks/queries/useGatepasses";
import { ConfirmModal } from "../ui/ConfirmModal";
import { fmt, fmtTime } from "./utils";
import type { Request } from "./RequestTypes";

const statusConfig: Record<
  string,
  { icon: React.ReactNode; bg: string; text: string; border: string; label: string; gradient: string }
> = {
  APPROVED: {
    icon: <CheckCircle2 className="h-8 w-8" />,
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800/60",
    label: "Approved",
    gradient: "from-emerald-400 to-teal-500 shadow-emerald-500/20",
  },
  PENDING: {
    icon: <AlertTriangle className="h-8 w-8" />,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800/60",
    label: "Pending Review",
    gradient: "from-amber-400 to-orange-500 shadow-amber-500/20",
  },
  REJECTED: {
    icon: <XCircle className="h-8 w-8" />,
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800/60",
    label: "Rejected",
    gradient: "from-red-500 to-rose-600 shadow-red-500/20",
  },
  CANCELLED: {
    icon: <Ban className="h-8 w-8" />,
    bg: "bg-gray-50 dark:bg-gray-800/40",
    text: "text-gray-500 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-700/60",
    label: "Cancelled",
    gradient: "from-gray-400 to-slate-500 shadow-gray-500/20",
  },
  REVOKED: {
    icon: <AlertCircle className="h-8 w-8" />,
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800/60",
    label: "Revoked by Admin",
    gradient: "from-rose-500 to-pink-600 shadow-rose-500/20",
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
  const cancelLeaveMutation = useCancelLeave();
  const cancelGatepassMutation = useCancelGatepass();
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  const isLeave = request.type === "LEAVE";
  const cfg = statusConfig[request.status] ?? statusConfig["PENDING"];
  const m = request.metadata ?? {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const leaveStart = m.startDate ? new Date(`${m.startDate}T00:00:00`) : null;
  const gatepassOut = m.requestedOutTime ? new Date(m.requestedOutTime) : null;
  const leaveIsFuture = !!leaveStart && leaveStart.getTime() > today.getTime();
  const gatepassIsFuture = !!gatepassOut && gatepassOut.getTime() > Date.now();
  const canCancelLeave = isLeave && request.status === "PENDING" && leaveIsFuture;
  const canRevokeLeave = isLeave && request.status === "APPROVED" && leaveIsFuture;
  const canCancelGatepass = !isLeave && (request.status === "PENDING" || request.status === "APPROVED") && gatepassIsFuture && !m.actualOutTime;
  const isLockedByTime =
    (isLeave && (request.status === "PENDING" || request.status === "APPROVED") && !leaveIsFuture) ||
    (!isLeave && (request.status === "PENDING" || request.status === "APPROVED") && (!gatepassIsFuture || !!m.actualOutTime));

  const handleRevoke = async () => {
    try {
      await revokeMutation.mutateAsync({ leaveId: request.id, reason: "Revoked by user" });
      pushToast({ title: "Success", message: "Leave request revoked.", tone: "success" });
      setShowRevokeConfirm(false);
      onClose();
    } catch (err: any) {
      pushToast({ title: "Error", message: err.response?.data?.message || "Failed to revoke", tone: "error" });
    }
  };

  const handleCancel = async () => {
    try {
      if (isLeave) {
        await cancelLeaveMutation.mutateAsync(request.id);
        pushToast({ title: "Success", message: "Leave request cancelled.", tone: "success" });
      } else {
        await cancelGatepassMutation.mutateAsync(request.id);
        pushToast({ title: "Success", message: "Gatepass cancelled.", tone: "success" });
      }
      setShowCancelConfirm(false);
      onClose();
    } catch (err: any) {
      pushToast({ title: "Error", message: err.response?.data?.message || "Failed to cancel", tone: "error" });
    }
  };

  return (
    <>
      <AppModal
        isOpen={true}
        onClose={onClose}
        title={isLeave ? "Leave Details" : "Gatepass Details"}
        size="xl"
      >
        <div className="pb-4">
          <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/40 dark:shadow-black/40">
            {/* ── Status hero ─────────────────────────────────────── */}
            <div className={`relative flex items-center justify-between overflow-hidden bg-gradient-to-br ${cfg.gradient} p-6 sm:p-8 text-white`}>
              <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-black/10 blur-2xl" />
              
              <div className="relative z-10">
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Current Status</p>
                <h2 className="text-3xl sm:text-4xl font-black leading-none tracking-tight">{cfg.label}</h2>
                <div className="mt-4 flex items-center gap-2 rounded-full bg-black/10 px-3 py-1.5 backdrop-blur-md w-max">
                  {isLeave ? <Palmtree className="h-4 w-4" /> : <Ticket className="h-4 w-4" />}
                  <span className="text-[11px] font-black uppercase tracking-widest text-white/90">
                    {isLeave ? "Leave Request" : "Gatepass Request"}
                  </span>
                </div>
              </div>

              <div className="relative z-10 flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md ring-4 ring-white/30">
                {cfg.icon}
              </div>
            </div>

            {/* ── Meta grid ───────────────────────────────────────── */}
            <div className="p-6 sm:p-8">
              {isLeave ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                  <DetailRow label="Leave Type" value={m.leaveTypeName ?? "—"} />
                  <DetailRow
                    label="Applied On"
                    value={fmt(request.timestamp, { day: "numeric", month: "long", year: "numeric" })}
                  />
                  <DetailRow
                    label="Start Date"
                    value={
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-400" />
                        {m.startDate ?? "—"}
                      </span>
                    }
                  />
                  <DetailRow
                    label="End Date"
                    value={
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-400" />
                        {m.endDate ?? "—"}
                      </span>
                    }
                  />
                  {m.halfDay && (
                    <DetailRow
                      label="Half Day"
                      value={
                        <span className="flex items-center gap-2">
                          {m.halfType === "FIRST" ? (
                            <SunDim className="h-4 w-4 text-amber-400" />
                          ) : (
                            <Sunset className="h-4 w-4 text-orange-400" />
                          )}
                          {m.halfType === "FIRST" ? "First Half" : "Second Half"}
                        </span>
                      }
                    />
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                  <DetailRow label="Pass Type" value={m.gatepassType ?? "—"} />
                  <DetailRow
                    label="Applied On"
                    value={fmt(request.timestamp, { day: "numeric", month: "long", year: "numeric" })}
                  />
                  <DetailRow
                    label="Exit Time"
                    value={
                      m.requestedOutTime ? (
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-indigo-400" />
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
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-indigo-400" />
                          {fmtTime(m.requestedInTime)}
                        </span>
                      ) : (
                        "—"
                      )
                    }
                  />
                </div>
              )}

              {/* ── Reason / details ────────────────────────────────── */}
              {(m.reason || request.details) && (
                <>
                  <hr className="my-6 border-dashed border-gray-200 dark:border-gray-800" />
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Reason / Details
                    </p>
                    <p className="text-sm font-medium leading-relaxed text-gray-700 dark:text-gray-300">
                      {m.reason || request.details}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Actions ────────────────────────────────────────── */}
          <div className="mt-6 flex flex-col gap-3">
            {canCancelLeave && (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="w-full min-h-[56px] rounded-2xl bg-amber-500 py-3 text-sm font-black text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-600 active:scale-[0.98]"
              >
                Cancel Request
              </button>
            )}
            {canRevokeLeave && (
              <button
                type="button"
                onClick={() => setShowRevokeConfirm(true)}
                className="w-full min-h-[56px] rounded-2xl bg-rose-500 py-3 text-sm font-black text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-600 active:scale-[0.98]"
              >
                Revoke Request
              </button>
            )}
            {canCancelGatepass && (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="w-full min-h-[56px] rounded-2xl bg-amber-500 py-3 text-sm font-black text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-600 active:scale-[0.98]"
              >
                Cancel Gatepass
              </button>
            )}
            {isLockedByTime && (
              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400 dark:border-gray-800 dark:bg-gray-800/40">
                {isLeave ? "Locked after start date" : "Locked after scheduled exit time"}
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[56px] rounded-2xl border border-gray-200 bg-white py-3 text-sm font-black text-gray-600 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Close Details
            </button>
          </div>
        </div>
      </AppModal>

      <ConfirmModal
        isOpen={showRevokeConfirm}
        onClose={() => setShowRevokeConfirm(false)}
        onConfirm={handleRevoke}
        title="Revoke Leave Request"
        message="Are you sure you want to revoke this approved leave? Your balance will be restored, but your manager will be notified. This action requires confirmation."
        confirmText="REVOKE"
        requireConfirmText="REVOKE"
        isDestructive={true}
      />
      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
        title={isLeave ? "Cancel Leave Request" : "Cancel Gatepass"}
        message={isLeave ? "Cancel this pending leave request and restore the held balance if applicable?" : "Cancel this gatepass before the scheduled exit time?"}
        confirmText={isLeave ? "Cancel Request" : "Cancel Gatepass"}
        isDestructive={true}
      />
    </>
  );
}
