import { useMemo, useState, useRef, useEffect } from "react";
import {
  CheckCircle2, XCircle, Clock3, CalendarDays,
  MapPin, Inbox, ArrowRight, Ticket, PalmtreeIcon,
  AlertTriangle
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAppToast } from "../../components/ui/ToastProvider";
import { 
  useUnifiedInbox, 
  useApproveCorrection, 
  useRejectCorrection,
  useApproveOvertimeMutation,
  useRejectOvertimeMutation
} from "../../hooks/queries/useAttendance";
import { useApproveLeave, useRejectLeave, useRevokeLeave } from "../../hooks/queries/useLeaves";
import { useApproveGatepass, useRejectGatepass } from "../../hooks/queries/useGatepasses";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

interface UnifiedRequest {
  id: string; // e.g. "LEAVE-1"
  type: "LEAVE" | "GATEPASS" | "CORRECTION" | "OVERTIME";
  employeeName: string;
  employeeCode: string;
  details: string;
  timestamp: string;
  status: string;
  referenceDate: string;
}

// ── Helpers ───────────────────────────────────────────────────────
function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const TYPE_CONFIG = {
  LEAVE: {
    label: "Leave",
    icon: PalmtreeIcon,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    badgeBg: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    strip: "bg-blue-500",
    avatarBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300",
  },
  GATEPASS: {
    label: "Gatepass",
    icon: Ticket,
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/40",
    badgeBg: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
    strip: "bg-orange-500",
    avatarBg: "bg-orange-100 text-orange-600 dark:bg-orange-900/60 dark:text-orange-300",
  },
  CORRECTION: {
    label: "Correction",
    icon: Clock3,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    badgeBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    strip: "bg-emerald-500",
    avatarBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300",
  },
  OVERTIME: {
    label: "Overtime",
    icon: Clock3,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/40",
    badgeBg: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    strip: "bg-purple-500",
    avatarBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/60 dark:text-purple-300",
  },
} as const;

// ── Request Card ──────────────────────────────────────────────────
function RequestCard({
  req,
  onAction,
  isActioning,
}: {
  req: UnifiedRequest;
  onAction: (req: UnifiedRequest, action: "approve" | "reject" | "revoke") => void;
  isActioning: boolean;
}) {
  const cfg = TYPE_CONFIG[req.type];
  const Icon = cfg.icon;
  const initials = getInitials(req.employeeName);

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-xl hover:border-indigo-100 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-indigo-900">
      <div className={`absolute inset-y-0 left-0 w-1 ${cfg.strip} rounded-l-3xl`} />
      <div className="flex flex-col gap-5 p-5 pl-6 md:flex-row md:items-center md:gap-6 md:py-5 md:pl-7">
        <div className="flex items-center gap-3 md:w-56 md:shrink-0">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${cfg.avatarBg}`}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white">
              {req.employeeName}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
              {req.employeeCode}
            </p>
          </div>
        </div>
        <div className="min-w-0 flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${cfg.badgeBg}`}>
              <Icon className="h-3 w-3" />
              {cfg.label}
            </span>
          </div>
          <p className="line-clamp-2 text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">
            {req.details}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1 whitespace-nowrap">
              <CalendarDays className="h-3 w-3" />
              {new Date(req.timestamp).toLocaleDateString()}
            </span>
            <span className="text-gray-200 dark:text-gray-700">•</span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <MapPin className="h-3 w-3" />
              Verified Office
            </span>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:shrink-0">
          {req.status === "PENDING" ? (
            <>
              <button
                disabled={isActioning}
                onClick={() => onAction(req, "approve")}
                className="group/approve relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-md shadow-indigo-200/60 transition-all duration-150 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200/80 active:scale-[0.97] disabled:opacity-50 dark:shadow-indigo-900/40 sm:w-auto"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Approve</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover/approve:translate-x-0.5" />
              </button>
              <button
                disabled={isActioning}
                onClick={() => onAction(req, "reject")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white px-5 py-3 text-sm font-bold text-gray-500 transition-all duration-150 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-[0.97] disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-rose-900 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 sm:w-auto"
              >
                <XCircle className="h-4 w-4 shrink-0" />
                <span>Reject</span>
              </button>
            </>
          ) : req.status === "APPROVED" ? (
            <button
              disabled={isActioning}
              onClick={() => onAction(req, "revoke")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-3 text-sm font-black text-rose-600 transition-all duration-150 hover:bg-rose-600 hover:text-white active:scale-[0.97] disabled:opacity-50 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900 sm:w-auto"
            >
              <XCircle className="h-4 w-4 shrink-0" />
              <span>Revoke Approval</span>
            </button>
          ) : (
            <div className="flex h-11 items-center px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
              {req.status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton Loader ───────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="absolute inset-y-0 left-0 w-1 rounded-l-3xl bg-gray-200 dark:bg-gray-700" />
      <div className="flex animate-pulse flex-col gap-4 pl-2 md:flex-row md:items-center md:gap-6">
        <div className="flex items-center gap-3 md:w-56">
          <div className="h-11 w-11 rounded-2xl bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-28 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-2.5 w-16 rounded-full bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-5 w-20 rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-full max-w-xs rounded-full bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-11 w-32 rounded-2xl bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

// ── Inbox Zero State ──────────────────────────────────────────────
function InboxZero() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-gray-200 bg-gray-50/50 py-24 text-center dark:border-gray-800 dark:bg-gray-900/30">
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl shadow-emerald-200/60 dark:shadow-emerald-900/40">
          <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2} />
        </div>
      </div>
      <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">You&apos;re all caught up!</h2>
      <p className="mt-2 max-w-xs text-sm text-gray-500 dark:text-gray-400">
        Outstanding work — your team's requests are all handled.
      </p>
    </div>
  );
}

const TABS = [
  { key: "PENDING", label: "Pending Requests", icon: Inbox },
  { key: "APPROVED", label: "Approved History", icon: CheckCircle2 },
  { key: "REJECTED", label: "Rejected History", icon: XCircle },
] as const;

// ── Main Component ────────────────────────────────────────────────
export default function UnifiedInbox() {
  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [revokeModal, setRevokeModal] = useState<{ isOpen: boolean; request: UnifiedRequest | null }>({
    isOpen: false,
    request: null
  });
  const { pushToast } = useAppToast();
  const parentRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useUnifiedInbox(activeTab);

  const allRequests = useMemo<UnifiedRequest[]>(() => {
    return data?.pages.flatMap(page => page.content.map((item: any) => ({
      id: item.id,
      type: item.requestType as any,
      employeeName: item.employeeName,
      employeeCode: item.employeeCode,
      details: item.details,
      timestamp: item.createdAt,
      status: item.status,
      referenceDate: item.referenceDate
    }))) || [];
  }, [data]);

  const virtualizer = useVirtualizer({
    count: allRequests.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 5,
  });

  useEffect(() => {
    const lastItem = [...virtualizer.getVirtualItems()].pop();
    if (lastItem && lastItem.index >= allRequests.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [virtualizer.getVirtualItems(), hasNextPage, isFetchingNextPage, fetchNextPage, allRequests.length]);

  const approveLeave = useApproveLeave();
  const rejectLeave = useRejectLeave();
  const approveGatepass = useApproveGatepass();
  const rejectGatepass = useRejectGatepass();
  const approveCorrection = useApproveCorrection();
  const rejectCorrection = useRejectCorrection();
  const approveOvertime = useApproveOvertimeMutation("me");
  const rejectOvertime = useRejectOvertimeMutation("me");
  const revokeLeave = useRevokeLeave();

  const handleAction = async (request: UnifiedRequest, action: "approve" | "reject" | "revoke") => {
    if (action === "revoke") {
      setRevokeModal({ isOpen: true, request });
      return;
    }

    const rawId = parseInt(request.id.split("-")[1]);
    const key = request.id;
    setActioningId(key);
    try {
      if (request.type === "LEAVE") {
        if (action === "approve") await approveLeave.mutateAsync(rawId);
        else await rejectLeave.mutateAsync({ leaveId: rawId, data: { rejectionReason: "Manager action" } });
      } else if (request.type === "GATEPASS") {
        if (action === "approve") await approveGatepass.mutateAsync(rawId);
        else await rejectGatepass.mutateAsync({ id: rawId, data: { rejectionReason: "Manager action" } });
      } else if (request.type === "CORRECTION") {
        if (action === "approve") await approveCorrection.mutateAsync(rawId);
        else await rejectCorrection.mutateAsync({ logId: rawId, reason: "Manager action" });
      } else if (request.type === "OVERTIME") {
        if (action === "approve") await approveOvertime.mutateAsync(rawId);
        else await rejectOvertime.mutateAsync(rawId);
      }
      pushToast({ title: "Success", message: `${request.type} ${action}d`, tone: "success" });
    } catch {
      pushToast({ title: "Error", message: `Failed to ${action} request`, tone: "error" });
    } finally {
      setActioningId(null);
    }
  };

  const confirmRevoke = async () => {
    const request = revokeModal.request;
    if (!request) return;

    const rawId = parseInt(request.id.split("-")[1]);
    setActioningId(request.id);
    try {
      await revokeLeave.mutateAsync({ leaveId: rawId, reason: "Revoked by Manager" });
      pushToast({ title: "Success", message: "Leave approval revoked", tone: "success" });
    } catch {
      pushToast({ title: "Error", message: "Failed to revoke approval", tone: "error" });
    } finally {
      setActioningId(null);
      setRevokeModal({ isOpen: false, request: null });
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl overflow-hidden space-y-6 px-4 sm:px-6 md:px-8">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-6 shadow-xl shadow-indigo-200/40 dark:shadow-indigo-900/40 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
              <Inbox className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">Manager Console</p>
              <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">Unified Inbox</h1>
            </div>
          </div>
          <div className="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 focus:outline-none opacity-0">
            {/* Notification system decommissioned */}
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === key ? "bg-white text-indigo-600 shadow dark:bg-gray-800" : "text-gray-500 hover:text-gray-900"}`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : allRequests.length === 0 ? (
        <InboxZero />
      ) : (
        <div ref={parentRef} className="h-[600px] overflow-auto pr-2 no-scrollbar">
          <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
            {virtualizer.getVirtualItems().map((v) => {
              const req = allRequests[v.index];
              return (
                <div key={req.id} className="absolute left-0 top-0 w-full" style={{ transform: `translateY(${v.start}px)`, height: `${v.size}px` }}>
                  <div className="pb-3">
                    <RequestCard req={req} onAction={handleAction} isActioning={actioningId === req.id} />
                  </div>
                </div>
              );
            })}
          </div>
          {isFetchingNextPage && <div className="py-4 text-center"><div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" /></div>}
        </div>
      )}

      <ConfirmModal
        isOpen={revokeModal.isOpen}
        onClose={() => setRevokeModal({ isOpen: false, request: null })}
        onConfirm={confirmRevoke}
        title="Revoke Leave Approval"
        message={`Are you absolutely sure you want to revoke the approved leave for ${revokeModal.request?.employeeName}? This will refund their balance and notify them immediately.`}
        confirmText="Revoke Approval"
        requireConfirmText="REVOKE"
        isDestructive={true}
      />
    </div>
  );
}