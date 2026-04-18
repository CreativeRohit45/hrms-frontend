import { useMemo, useState } from "react";
import {
  CheckCircle2, XCircle, Clock3, CalendarDays,
  MapPin, Inbox, ArrowRight, Ticket, PalmtreeIcon,
  Sparkles, SlidersHorizontal, Bell
} from "lucide-react";
import { useAppToast } from "../../components/ui/ToastProvider";
import api from "../../api/axios";
import { queryClient } from "../../lib/queryClient";
import { queryKeys } from "../../lib/queryKeys";

// ── TanStack Query hooks (3-way parallel fetching) ────────────────
import { usePendingLeaves, useApproveLeave, useRejectLeave } from "../../hooks/queries/useLeaves";
import { usePendingGatepasses, useApproveGatepass, useRejectGatepass } from "../../hooks/queries/useGatepasses";
import { useQuery } from "@tanstack/react-query";
import type { AttendanceLogResponse } from "../../types/attendance";

interface UnifiedRequest {
  id: string | number;
  type: "LEAVE" | "GATEPASS" | "ATTENDANCE";
  employeeName: string;
  employeeCode: string;
  details: string;
  timestamp: string;
  status: string;
  metadata?: any;
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
  ATTENDANCE: {
    label: "Correction",
    icon: Clock3,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    badgeBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    strip: "bg-emerald-500",
    avatarBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300",
  },
} as const;

// ── Request Card ──────────────────────────────────────────────────
function RequestCard({
  req,
  onAction,
  isActioning,
}: {
  req: UnifiedRequest;
  onAction: (req: UnifiedRequest, action: "approve" | "reject") => void;
  isActioning: boolean;
}) {
  const cfg = TYPE_CONFIG[req.type];
  const Icon = cfg.icon;
  const initials = getInitials(req.employeeName);

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-xl hover:border-indigo-100 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-indigo-900">
      {/* Color accent strip */}
      <div className={`absolute inset-y-0 left-0 w-1 ${cfg.strip} rounded-l-3xl`} />

      {/* Card body */}
      <div className="flex flex-col gap-5 p-5 pl-6 md:flex-row md:items-center md:gap-6 md:py-5 md:pl-7">

        {/* ── Avatar + Name ── */}
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

        {/* ── Type badge + Details ── */}
        <div className="min-w-0 flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${cfg.badgeBg}`}
            >
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
              {new Date(req.timestamp).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="text-gray-200 dark:text-gray-700">•</span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <MapPin className="h-3 w-3" />
              Verified Office
            </span>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:shrink-0">
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
          <div className="h-2.5 w-32 rounded-full bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="flex gap-2 md:flex-col lg:flex-row">
          <div className="h-11 w-32 rounded-2xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-11 w-24 rounded-2xl bg-gray-100 dark:bg-gray-800" />
        </div>
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
        <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-yellow-900" />
        </div>
      </div>
      <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
        You&apos;re all caught up!
      </h2>
      <p className="mt-2 max-w-xs text-sm text-gray-500 dark:text-gray-400">
        Outstanding work — your team's requests are all handled. Enjoy the clarity.
      </p>
      <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">
        <Sparkles className="h-3 w-3" />
        Inbox Zero Achieved
      </div>
    </div>
  );
}

// ── TABS CONFIG ───────────────────────────────────────────────────
const TABS = [
  { key: "ALL", label: "All Requests", icon: Inbox },
  { key: "LEAVE", label: "Leaves", icon: PalmtreeIcon },
  { key: "GATEPASS", label: "Gatepasses", icon: Ticket },
  { key: "ATTENDANCE", label: "Corrections", icon: Clock3 },
] as const;

// ── Main Component ────────────────────────────────────────────────
export default function UnifiedInbox() {
  const [activeTab, setActiveTab] = useState<"ALL" | "LEAVE" | "GATEPASS" | "ATTENDANCE">("ALL");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const { pushToast } = useAppToast();

  // ── 3-way parallel data fetching — no waterfall ────────────────
  const { data: leavesRaw = [], isLoading: leavesLoading } = usePendingLeaves(true);
  const { data: gatepassesRaw = [], isLoading: gatepassesLoading } = usePendingGatepasses(true);
  const { data: correctionsRaw = [], isLoading: correctionsLoading } = useQuery<AttendanceLogResponse[]>({
    queryKey: queryKeys.attendance.pendingCorrections(),
    queryFn: async () => {
      const res = await api.get("/api/v1/attendance/pending-corrections");
      return res.data;
    },
  });

  const loading = leavesLoading || gatepassesLoading || correctionsLoading;

  // ── Mutations ──────────────────────────────────────────────────
  const approveLeave = useApproveLeave();
  const rejectLeave = useRejectLeave();
  const approveGatepass = useApproveGatepass();
  const rejectGatepass = useRejectGatepass();

  // ── Normalize into unified request list ────────────────────────
  const requests = useMemo<UnifiedRequest[]>(() => {
    const normalized: UnifiedRequest[] = [
      ...leavesRaw.map((l: any) => ({
        id: l.id,
        type: "LEAVE" as const,
        employeeName: l.fullName,
        employeeCode: l.employeeCode,
        details: `${l.leaveTypeName}: ${l.startDate} to ${l.endDate}`,
        timestamp: l.createdAt || new Date().toISOString(),
        status: "PENDING",
        metadata: l,
      })),
      ...gatepassesRaw.map((g: any) => ({
        id: g.id,
        type: "GATEPASS" as const,
        employeeName: g.fullName,
        employeeCode: g.employeeCode,
        details: `${g.gatepassType}: Out ${new Date(g.requestedOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        timestamp: g.createdAt || new Date().toISOString(),
        status: "PENDING",
        metadata: g,
      })),
      ...correctionsRaw.map((c: any) => ({
        id: c.id,
        type: "ATTENDANCE" as const,
        employeeName: c.fullName,
        employeeCode: c.employeeCode,
        details: `Correction for ${c.workDate}: ${new Date(c.requestedPunchInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${new Date(c.requestedPunchOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        timestamp: c.workDate,
        status: "PENDING",
        metadata: c,
      })),
    ];

    return normalized.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [leavesRaw, gatepassesRaw, correctionsRaw]);

  // ── Counts ─────────────────────────────────────────────────────
  const counts = useMemo(
    () => ({
      ALL: requests.length,
      LEAVE: requests.filter((r) => r.type === "LEAVE").length,
      GATEPASS: requests.filter((r) => r.type === "GATEPASS").length,
      ATTENDANCE: requests.filter((r) => r.type === "ATTENDANCE").length,
    }),
    [requests]
  );

  const handleAction = async (request: UnifiedRequest, action: "approve" | "reject") => {
    const key = `${request.type}-${request.id}`;
    setActioningId(key);
    try {
      if (request.type === "LEAVE") {
        if (action === "approve") {
          await approveLeave.mutateAsync(request.id as number);
        } else {
          await rejectLeave.mutateAsync({
            leaveId: request.id as number,
            data: { rejectionReason: "Manager manual action" },
          });
        }
      } else if (request.type === "GATEPASS") {
        if (action === "approve") {
          await approveGatepass.mutateAsync(request.id as number);
        } else {
          await rejectGatepass.mutateAsync({
            id: request.id as number,
            data: { rejectionReason: "Manager manual action" },
          });
        }
      } else if (request.type === "ATTENDANCE") {
        const endpoint = `/api/v1/attendance/corrections/${request.id}/${action}`;
        if (action === "approve") {
          await api.put(endpoint);
        } else {
          await api.put(endpoint, { rejectionReason: "Manager manual action" });
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.attendance.pendingCorrections() });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      }

      pushToast({
        title: "Success",
        message: `${request.type} ${action === "approve" ? "approved" : "rejected"}`,
        tone: "success",
      });
    } catch {
      pushToast({
        title: "Action Failed",
        message: `Failed to ${action} ${request.type} request`,
        tone: "error",
      });
    } finally {
      setActioningId(null);
    }
  };

  const filtered = activeTab === "ALL" ? requests : requests.filter((r) => r.type === activeTab);

  return (
    <div className="mx-auto w-full max-w-5xl overflow-hidden space-y-6 px-4 sm:px-6 md:px-8">

      {/* ═══════════════════════════════════════════════════════════
          MISSION 1 — COMMAND CENTER HERO
      ═══════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-6 shadow-xl shadow-indigo-200/40 dark:shadow-indigo-900/40 md:p-8">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
              <Inbox className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
                Manager Console
              </p>
              <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                Unified Inbox
              </h1>
            </div>
          </div>

          {/* Bell with badge */}
          <div className="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Bell className="h-5 w-5 text-white" />
            {counts.ALL > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-indigo-700">
                {counts.ALL > 9 ? "9+" : counts.ALL}
              </span>
            )}
          </div>
        </div>

        {/* Stat pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          {/* Total */}
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3.5 py-2 ring-1 ring-white/20 backdrop-blur-sm">
            <span className="text-xl font-black tabular-nums text-white">{counts.ALL}</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-200">Total</span>
          </div>

          {counts.LEAVE > 0 && (
            <div className="flex items-center gap-2 rounded-2xl bg-blue-500/20 px-3.5 py-2 ring-1 ring-blue-400/30 backdrop-blur-sm">
              <PalmtreeIcon className="h-3.5 w-3.5 text-blue-300" />
              <span className="text-lg font-black tabular-nums text-white">{counts.LEAVE}</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-200">Leave</span>
            </div>
          )}

          {counts.GATEPASS > 0 && (
            <div className="flex items-center gap-2 rounded-2xl bg-orange-500/20 px-3.5 py-2 ring-1 ring-orange-400/30 backdrop-blur-sm">
              <Ticket className="h-3.5 w-3.5 text-orange-300" />
              <span className="text-lg font-black tabular-nums text-white">{counts.GATEPASS}</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-orange-200">Gatepass</span>
            </div>
          )}

          {counts.ATTENDANCE > 0 && (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/20 px-3.5 py-2 ring-1 ring-emerald-400/30 backdrop-blur-sm">
              <Clock3 className="h-3.5 w-3.5 text-emerald-300" />
              <span className="text-lg font-black tabular-nums text-white">{counts.ATTENDANCE}</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-200">Correction</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MISSION 2 — SEGMENTED FILTER CONTROL
      ═══════════════════════════════════════════════════════════ */}
      <div className="w-full overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2 rounded-2xl bg-gray-100/80 p-1.5 dark:bg-gray-900/60">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            const count = counts[key];
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`
                  relative flex min-w-[44px] items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200
                  ${isActive
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-400"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                  }
                `}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-indigo-500" : "text-gray-400"}`} />
                <span className="whitespace-nowrap">{label}</span>
                {count > 0 && (
                  <span
                    className={`
                      inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black tabular-nums
                      ${isActive
                        ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300"
                        : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                      }
                    `}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MISSION 3 & 4 — CARDS OR STATES
      ═══════════════════════════════════════════════════════════ */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <InboxZero />
      ) : (
        <div className="space-y-3">
          {/* Section label */}
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">
              {filtered.length} Pending {filtered.length === 1 ? "Request" : "Requests"}
            </p>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
              <SlidersHorizontal className="h-3 w-3" />
              Sorted by Newest
            </div>
          </div>

          {filtered.map((req) => (
            <RequestCard
              key={`${req.type}-${req.id}`}
              req={req}
              onAction={handleAction}
              isActioning={actioningId === `${req.type}-${req.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}