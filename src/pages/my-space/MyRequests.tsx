import { useState } from "react";
import {
  Plus,
  Palmtree,
  Ticket,
  Sparkles,
  FileText,
  Inbox,
  CheckCircle2,
  Clock,
  LayoutGrid,
} from "lucide-react";

// ── TanStack Query hooks (parallel fetching) ──────────────────────
import { useMyLeaves } from "../../hooks/queries/useLeaves";
import { useMyGatepasses } from "../../hooks/queries/useGatepasses";
import { useDashboardStats } from "../../hooks/queries/useDashboard";

// ── Shared extracted components ────────────────────────────────────
import type { Request, TabValue } from "../../components/requests/RequestTypes";
import { RequestCard } from "../../components/requests/RequestCard";
import { SegmentedControl } from "../../components/requests/SegmentedControl";
import { FloatingActionMenu } from "../../components/requests/FloatingActionMenu";
import { RequestDetailsModal } from "../../components/requests/RequestDetailsModal";
import { LeaveApplyModal } from "../../components/requests/LeaveApplyModal";
import { GatepassApplyModal } from "../../components/requests/GatepassApplyModal";

// ─────────────────────────────────────────────────────────────────
// Skeleton card for loading state
// ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4 dark:border-gray-800/60 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 flex-shrink-0 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        <div className="flex-1 space-y-2">
          <div className="h-2.5 w-20 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
          <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────
export default function MyRequests() {
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showGatepassModal, setShowGatepassModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("ALL");

  const { data: stats } = useDashboardStats();
  const isActive = !!stats?.currentSession?.active;

  // ── Parallel data fetching — no waterfall ──────────────────────
  const { data: leavesRaw = [], isLoading: leavesLoading } = useMyLeaves();
  const { data: gatepassesRaw = [], isLoading: gatepassesLoading } = useMyGatepasses();

  const loading = leavesLoading || gatepassesLoading;

  // ── Normalize into unified request list ────────────────────────
  const requests: Request[] = [
    ...leavesRaw.map((l: any) => ({
      id: l.id,
      type: "LEAVE" as const,
      details: `${l.leaveTypeName}: ${l.startDate} to ${l.endDate}`,
      status: l.status,
      timestamp: l.createdAt || new Date().toISOString(),
      pendingApproverName: l.pendingApproverName,
      actionByName: l.actionByName,
      metadata: l,
    })),
    ...gatepassesRaw.map((g: any) => ({
      id: g.id,
      type: "GATEPASS" as const,
      details: `${g.gatepassType}: ${new Date(g.requestedOutTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })} transit`,
      status: g.status,
      timestamp: g.createdAt || new Date().toISOString(),
      metadata: g,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const leaves = requests.filter((r) => r.type === "LEAVE");
  const gatepasses = requests.filter((r) => r.type === "GATEPASS");

  const visibleRequests =
    activeTab === "ALL" ? requests : activeTab === "LEAVE" ? leaves : gatepasses;

  const handleOpenLeave = () => {
    setShowLeaveModal(true);
  };

  const handleOpenGatepass = () => {
    setShowGatepassModal(true);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-3 pb-28 pt-2 sm:space-y-6 sm:px-6 md:px-8 overflow-x-hidden">

      {/* ── MODAL PORTAL ──────────────────────────────────────────── */}
      <div>
        {showLeaveModal && (
          <LeaveApplyModal
            onClose={() => setShowLeaveModal(false)}
            onSuccess={() => setShowLeaveModal(false)}
          />
        )}
        {showGatepassModal && (
          <GatepassApplyModal
            onClose={() => setShowGatepassModal(false)}
            onSuccess={() => setShowGatepassModal(false)}
          />
        )}
        {selectedRequest && (
          <RequestDetailsModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
          />
        )}
      </div>

      {/* ── HERO BANNER ── */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-5 shadow-xl shadow-indigo-200/40 dark:shadow-indigo-900/40 sm:p-6 md:p-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
              <Inbox className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
                Requests Hub
              </p>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white md:text-3xl truncate">
                My Requests
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ROW (Outside) ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { 
            label: "Approved", 
            value: requests.filter((r) => r.status === "APPROVED").length,
            icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
            bg: "bg-emerald-50/50 dark:bg-emerald-950/10"
          },
          { 
            label: "Pending", 
            value: requests.filter((r) => r.status === "PENDING").length,
            icon: <Clock className="h-3.5 w-3.5 text-indigo-500" />,
            bg: "bg-indigo-50/50 dark:bg-indigo-950/10"
          },
          { 
            label: "Total", 
            value: requests.length,
            icon: <LayoutGrid className="h-3.5 w-3.5 text-gray-400" />,
            bg: "bg-gray-50/50 dark:bg-gray-800/40"
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-gray-100 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5">
            <div className="flex items-center gap-2 mb-1">
              {stat.icon}
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{stat.label}</p>
            </div>
            <p className="text-xl font-black text-gray-900 dark:text-white sm:text-2xl">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── ACTION BAR ────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={handleOpenLeave}
          className="group relative flex items-center justify-between overflow-hidden rounded-3xl bg-white p-2 pl-6 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md hover:ring-indigo-100 active:scale-[0.98] dark:bg-gray-900 dark:ring-gray-800"
        >
          <div className="flex flex-col items-start">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Time Off</p>
            <p className="text-sm font-black text-gray-900 dark:text-white">Apply for Leave</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-all group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-900/30 dark:text-indigo-400">
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
          </div>
        </button>

        <button
          onClick={handleOpenGatepass}
          disabled={!isActive}
          className="group relative flex items-center justify-between overflow-hidden rounded-3xl bg-white p-2 pl-6 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md hover:ring-indigo-100 active:scale-[0.98] disabled:opacity-50 dark:bg-gray-900 dark:ring-gray-800"
        >
          <div className="flex flex-col items-start">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Exit Permit</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-gray-900 dark:text-white">Request Gatepass</p>
              {!isActive && <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[8px] font-bold text-red-500 uppercase tracking-tighter dark:bg-red-950/20">Inactive</span>}
            </div>
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isActive ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-600'} transition-all`}>
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
          </div>
        </button>
      </div>

      {/* ── ACTIVITY FEED ─────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-sm dark:border-gray-800/60 dark:bg-gray-900">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 sm:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800">
              <FileText className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white">Activity Timeline</h2>
              <p className="text-xs text-gray-400">History of all your requests</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-2 sm:px-10">
          <SegmentedControl
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { label: "All", value: "ALL", icon: <Sparkles className="h-3.5 w-3.5" />, count: requests.length },
              { label: "Leaves", value: "LEAVE", icon: <Palmtree className="h-3.5 w-3.5" />, count: leaves.length },
              { label: "Gatepasses", value: "GATEPASS", icon: <Ticket className="h-3.5 w-3.5" />, count: gatepasses.length },
            ]}
          />
        </div>

        <div className="space-y-3 px-6 py-6 sm:px-10 sm:pb-10">
          {loading ? (
            <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
          ) : visibleRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-gray-200 py-16 dark:border-gray-700/60">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800">
                <Inbox className="h-8 w-8 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="mt-4 text-sm font-bold text-gray-900 dark:text-white">No requests yet</p>
              <p className="mt-1 text-xs text-gray-400">Your application history will appear here.</p>
            </div>
          ) : (
            visibleRequests.map((req) => (
              <RequestCard
                key={`${req.type}-${req.id}`}
                req={req}
                onClick={setSelectedRequest}
              />
            ))
          )}
        </div>
      </div>

      {/* ── FAB ───────────────────────────────────────────────────── */}
      <FloatingActionMenu 
        onLeave={handleOpenLeave} 
        onGatepass={handleOpenGatepass} 
        isActive={isActive}
      />
    </div>
  );
}
