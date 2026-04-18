import { useMemo, useState } from "react";
import { 
  CheckCircle2, XCircle, Clock3, CalendarDays, 
  MapPin, UserCircle2, Inbox, ArrowRight,
  ClipboardList, Ticket, HelpCircle
} from "lucide-react";
import { useAppToast } from "../../components/ui/ToastProvider";
import api from "../../api/axios";
import { StatusBadge } from "../../components/ui/StatusBadge";
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

export default function UnifiedInbox() {
  const [activeTab, setActiveTab] = useState<"ALL" | "LEAVE" | "GATEPASS" | "ATTENDANCE">("ALL");
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
        metadata: l
      })),
      ...gatepassesRaw.map((g: any) => ({
        id: g.id,
        type: "GATEPASS" as const,
        employeeName: g.fullName,
        employeeCode: g.employeeCode,
        details: `${g.gatepassType}: Out ${new Date(g.requestedOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        timestamp: g.createdAt || new Date().toISOString(),
        status: "PENDING",
        metadata: g
      })),
      ...correctionsRaw.map((c: any) => ({
        id: c.id,
        type: "ATTENDANCE" as const,
        employeeName: c.fullName,
        employeeCode: c.employeeCode,
        details: `Correction for ${c.workDate}: ${new Date(c.requestedPunchInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(c.requestedPunchOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        timestamp: c.workDate,
        status: "PENDING",
        metadata: c
      }))
    ];

    return normalized.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [leavesRaw, gatepassesRaw, correctionsRaw]);

  const handleAction = async (request: UnifiedRequest, action: "approve" | "reject") => {
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
        // Attendance corrections use direct API calls (already has hooks
        // in useAttendance.ts, but here we use the simple endpoint)
        const endpoint = `/api/v1/attendance/corrections/${request.id}/${action}`;
        if (action === "approve") {
          await api.put(endpoint);
        } else {
          await api.put(endpoint, { rejectionReason: "Manager manual action" });
        }
        // Invalidate attendance caches
        queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.attendance.pendingCorrections() });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      }

      pushToast({ title: "Success", message: `${request.type} ${action === "approve" ? "approved" : "rejected"}`, tone: "success" });
    } catch (error) {
      pushToast({ title: "Action Failed", message: `Failed to ${action} ${request.type} request`, tone: "error" });
    }
  };

  const filtered = activeTab === "ALL" ? requests : requests.filter(r => r.type === activeTab);

  const getIcon = (type: string) => {
    if (type === "LEAVE") return <ClipboardList className="h-5 w-5 text-blue-500" />;
    if (type === "GATEPASS") return <Ticket className="h-5 w-5 text-orange-500" />;
    return <Clock3 className="h-5 w-5 text-emerald-500" />;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50 dark:bg-indigo-950/40">
              <Inbox className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Unified Inbox</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage all team approvals in one place</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-[1.25rem] bg-gray-100 p-1 dark:bg-gray-900/50">
          {(["ALL", "LEAVE", "GATEPASS", "ATTENDANCE"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === tab ? "bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-400" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 flex-col items-center justify-center space-y-4">
           <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
           <p className="text-xs font-black uppercase tracking-widest text-gray-400">Syncing Inbox...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-gray-200 py-32 dark:border-gray-800">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <p className="mt-6 text-xl font-bold">You&apos;re all caught up!</p>
          <p className="mt-1 text-sm text-gray-500">No pending requests require your attention.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-1">
          {filtered.map((req) => (
            <div 
              key={`${req.type}-${req.id}`}
              className="group relative flex flex-col gap-6 overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-indigo-200 hover:shadow-xl md:flex-row md:items-center dark:border-gray-800 dark:bg-gray-900 dark:hover:border-indigo-900"
            >
              {/* ACCENT STRIP */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                req.type === 'LEAVE' ? 'bg-blue-500' : req.type === 'GATEPASS' ? 'bg-orange-500' : 'bg-emerald-500'
              }`} />

              {/* REQUEST TYPE INDICATOR */}
              <div className="flex shrink-0 items-center justify-center rounded-2xl bg-gray-50 p-4 transition-colors group-hover:bg-indigo-50 dark:bg-gray-800 dark:group-hover:bg-indigo-950/30">
                {getIcon(req.type)}
              </div>

              {/* EMPLOYEE INFO */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <UserCircle2 className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{req.employeeName}</span>
                  </div>
                  <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:bg-gray-800">{req.employeeCode}</span>
                  <StatusBadge label="PENDING REVIEW" tone="warning" />
                </div>
                
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                    {req.details}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-tight text-gray-400">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(req.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    <span className="mx-1">•</span>
                    <MapPin className="h-3.5 w-3.5" />
                    Verified Office
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(req, "approve")}
                  className="group/btn flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 dark:shadow-indigo-900/40"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </button>
                <button
                  onClick={() => handleAction(req, "reject")}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white px-6 py-3 text-sm font-bold text-gray-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-rose-950/20"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
