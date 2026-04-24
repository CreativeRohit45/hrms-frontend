import { useState } from "react";
import {
  Plus,
  Palmtree,
  Ticket,
  AlertCircle,
  Sparkles,
  FileText,
} from "lucide-react";
import { useAppToast } from "../../components/ui/ToastProvider";

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
  const { pushToast } = useAppToast();

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
    pushToast({ title: "Opening Form", message: "Syncing Leave Application Drawer...", tone: "info" });
    setShowLeaveModal(true);
  };

  const handleOpenGatepass = () => {
    pushToast({ title: "Opening Form", message: "Syncing Gatepass Request Drawer...", tone: "info" });
    setShowGatepassModal(true);
  };

  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden space-y-6 px-4 sm:px-6 md:px-8 pb-28 pt-4">

      {/* ── MODAL PORTAL ──────────────────────────────────────────── */}
      <div className="relative z-[1000]">
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

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-indigo-600 px-5 py-7 text-white shadow-xl shadow-indigo-600/20 sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-indigo-400/30 blur-2xl" />

        <div className="relative space-y-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200/80">
              Requests Hub
            </p>
            <h1 className="mt-1 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
              My Requests
            </h1>
            <p className="mt-1.5 max-w-sm text-sm text-indigo-100/70">
              Track leaves &amp; gatepasses. Tap any card to view details.
            </p>
          </div>

          {/* Stats row */}
          <div className="flex gap-3">
            {[
              { label: "Approved", value: requests.filter((r) => r.status === "APPROVED").length },
              { label: "Pending", value: requests.filter((r) => r.status === "PENDING").length },
              { label: "Total", value: requests.length },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex-1 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-center backdrop-blur-sm sm:px-4"
              >
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200/70">
                  {stat.label}
                </p>
                <p className="mt-0.5 text-2xl font-black">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* CTA buttons — stacked on mobile, row on sm+ */}
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={handleOpenLeave}
              className="group flex flex-1 min-h-[48px] items-center justify-center gap-2.5 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/25 active:scale-[0.97]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition-transform duration-200 group-hover:rotate-90">
                <Plus className="h-4 w-4" />
              </span>
              Apply for Leave
            </button>
            <button
              type="button"
              onClick={handleOpenGatepass}
              disabled={!isActive}
              title={!isActive ? "You must be punched in to request a gatepass" : ""}
              className="group flex flex-1 min-h-[48px] items-center justify-center gap-2.5 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/25 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition-transform duration-200 group-hover:rotate-90">
                <Plus className="h-4 w-4" />
              </span>
              Request Gatepass
            </button>
          </div>
        </div>
      </div>

      {/* ── ACTIVITY FEED ─────────────────────────────────────────── */}
      <div className="rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-800/60 dark:bg-gray-900">
        <div className="flex items-center gap-2 px-4 pt-5 pb-4 sm:px-6">
          <FileText className="h-4 w-4 text-indigo-500" />
          <h2 className="text-base font-black text-gray-900 dark:text-white">Activity</h2>
        </div>

        <div className="px-4 pb-1 sm:px-6">
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

        <div className="space-y-3 px-4 py-4 sm:px-6 sm:pb-6">
          {loading ? (
            <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
          ) : visibleRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 py-14 dark:border-gray-700/60">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800">
                <AlertCircle className="h-7 w-7 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="mt-4 text-sm font-bold text-gray-400">No requests found</p>
              <p className="mt-1 text-xs text-gray-300 dark:text-gray-600">
                Tap + to create your first one.
              </p>
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