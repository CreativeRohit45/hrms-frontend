import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getMyAuditTrail, previewLeave
} from "../../api/leaves";
import type {
  LeaveBalanceResponse, LeaveResponse, LeaveTypeDTO,
  LeaveApplyRequest, LeaveBalanceAuditResponse, LeaveGrantRequest,
  LeavePreviewResponse
} from "../../types/leave";
import {
  Palmtree, Plus, X, Clock, CheckCircle2, XCircle, Ban,
  ChevronDown, FileText, AlertCircle, ArrowDownCircle, ArrowUpCircle,
  Shield, Gift,
} from "lucide-react";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { AppModal } from "../../components/ui/AppModal";
import {
  useMyBalances, useMyLeaves, useLeaveTypes, usePendingLeaves,
  useCancelLeave, useApproveLeave, useRejectLeave, useRevokeLeave,
  useApplyLeave, useGrantLeave, useMyAuditTrail
} from "../../hooks/queries/useLeaves";

// ═══════════════════════════════════════════════════════════════════
//  COLOR MAP
// ═══════════════════════════════════════════════════════════════════
const TYPE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  CL: { bg: "bg-sky-50 dark:bg-sky-950/30", text: "text-sky-600 dark:text-sky-400", bar: "bg-sky-500" },
  SL: { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500" },
  EL: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
  LWP: { bg: "bg-gray-100 dark:bg-gray-800/50", text: "text-gray-600 dark:text-gray-400", bar: "bg-gray-400" },
  CMP: { bg: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-600 dark:text-violet-400", bar: "bg-violet-500" },
  ML: { bg: "bg-pink-50 dark:bg-pink-950/30", text: "text-pink-600 dark:text-pink-400", bar: "bg-pink-500" },
  PL: { bg: "bg-indigo-50 dark:bg-indigo-950/30", text: "text-indigo-600 dark:text-indigo-400", bar: "bg-indigo-500" },
};
const defaultColor = { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" };

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  APPROVED: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  REJECTED: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800",
  CANCELLED: "bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

// ═══════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function LeavesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "HR_ADMIN" || user?.role === "SUPER_ADMIN";
  const isManager = user?.role === "DEPARTMENT_MANAGER" || isAdmin;

  // ── TanStack Query: Data fetching via custom hooks ─────────────
  const { data: balances = [], isLoading: balancesLoading } = useMyBalances();
  const { data: leaves = [], isLoading: leavesLoading } = useMyLeaves();
  const { data: leaveTypes = [] } = useLeaveTypes();
  const { data: pendingLeaves = [] } = usePendingLeaves(isManager);

  const loading = balancesLoading || leavesLoading;

  // ── TanStack Query: Mutations with cross-domain invalidation ───
  const cancelMutation = useCancelLeave();
  const approveMutation = useApproveLeave();
  const rejectMutation = useRejectLeave();
  const revokeMutation = useRevokeLeave();

  // UI state (unchanged)
  const [activeTab, setActiveTab] = useState<"my" | "approvals">("my");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<number | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Actions (now using mutation hooks) ─────────────────────────
  function handleCancel(id: number) {
    setCancelTarget(id);
  }
  async function confirmCancel() {
    if (!cancelTarget) return;
    setActionLoading(cancelTarget);
    try {
      await cancelMutation.mutateAsync(cancelTarget);
      showToast("success", "Leave cancelled & balance refunded.");
      setCancelTarget(null);
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Cancel failed.");
    } finally { setActionLoading(null); }
  }

  async function handleApprove(id: number) {
    setActionLoading(id);
    try {
      await approveMutation.mutateAsync(id);
      showToast("success", "Leave approved.");
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Approve failed.");
    } finally { setActionLoading(null); }
  }

  function handleRevoke(id: number) {
    setRevokeTarget(id);
    setRevokeReason("");
  }
  async function confirmRevoke() {
    if (!revokeTarget || !revokeReason.trim()) return;
    setActionLoading(revokeTarget);
    try {
      await revokeMutation.mutateAsync({ leaveId: revokeTarget, reason: revokeReason.trim() });
      showToast("success", "Leave revoked & balance refunded.");
      setRevokeTarget(null);
      setRevokeReason("");
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Revoke failed.");
    } finally { setActionLoading(null); }
  }

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64 animate-pulse">
      <div className="text-gray-400 dark:text-gray-500 font-mono text-sm">Loading leave data...</div>
    </div>
  );

  const totalBal = balances.reduce((s, b) => s + b.balance, 0);
  const totalAlloc = balances.reduce((s, b) => s + b.allocated, 0);

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12 animate-in fade-in duration-500">

      {/* ── Toast ──────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-right duration-300 ${toast.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
            : "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
          }`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100"><X size={14} /></button>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Palmtree className="text-amber-500" size={28} />
            Leave Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
            {new Date().getFullYear()} · {totalBal} days remaining of {totalAlloc} allocated
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowAuditModal(true)}
            className="px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex items-center gap-2">
            <FileText size={16} /> Ledger
          </button>
          <button onClick={() => setShowApplyModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2">
            <Plus size={16} /> Apply for Leave
          </button>
        </div>
      </div>

      {/* ── Balance Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {balances.map((b) => {
          const c = TYPE_COLORS[b.leaveTypeCode] || defaultColor;
          const pct = b.allocated > 0 ? (b.used / b.allocated) * 100 : 0;
          return (
            <div key={b.leaveTypeCode} className={`${c.bg} rounded-2xl p-4 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all group hover:shadow-md cursor-default`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-black uppercase tracking-widest ${c.text}`}>{b.leaveTypeCode}</span>
                <span className="text-lg font-black text-gray-900 dark:text-white tabular-nums">{b.balance}</span>
              </div>
              <div className="h-1.5 bg-white/60 dark:bg-gray-800/60 rounded-full overflow-hidden">
                <div className={`h-full ${c.bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                <span>{b.used} used</span>
                <span>{b.allocated} total</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 truncate group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">{b.leaveTypeName}</p>
            </div>
          );
        })}
        {balances.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-400 dark:text-gray-500 text-sm italic">
            No balances allocated for {new Date().getFullYear()}
          </div>
        )}
      </div>

      {/* ── Tabs (My Requests / Pending Approvals) ─────────────── */}
      {isManager && (
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl p-1 w-fit">
          <button onClick={() => setActiveTab("my")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "my" ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
            My Requests
          </button>
          <button onClick={() => setActiveTab("approvals")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "approvals" ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
            <Shield size={14} /> Pending Approvals
            {pendingLeaves.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{pendingLeaves.length}</span>
            )}
          </button>
          {isAdmin && (
            <button onClick={() => setShowGrantModal(true)}
              className="px-4 py-2 rounded-lg text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all flex items-center gap-2">
              <Gift size={14} /> Grant Leave
            </button>
          )}
        </div>
      )}

      {/* ── My Leave History ───────────────────────────────────── */}
      {activeTab === "my" && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">My Leave Requests</h3>
            <span className="text-xs text-gray-400 font-mono">{leaves.length} records</span>
          </div>
          {leaves.length === 0 ? (
            <div className="p-12 text-center text-gray-400 dark:text-gray-500">
              <Palmtree size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No leave requests yet</p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="max-md:hidden overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 font-mono text-[10px] uppercase tracking-widest">
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Dates</th>
                      <th className="px-5 py-3">Days</th>
                      <th className="px-5 py-3">Reason</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {leaves.map((l) => {
                      const canCancel = (l.status === "PENDING" || l.status === "APPROVED") && new Date(l.startDate) > new Date();
                      return (
                        <tr key={l.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors text-gray-700 dark:text-gray-300">
                          <td className="px-5 py-3">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${(TYPE_COLORS[l.leaveTypeCode] || defaultColor).bg} ${(TYPE_COLORS[l.leaveTypeCode] || defaultColor).text}`}>
                              {l.leaveTypeCode}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-mono text-xs whitespace-nowrap">
                            {l.startDate}{l.startDate !== l.endDate && ` → ${l.endDate}`}
                            {l.halfDay && <span className="ml-1 text-[10px] text-amber-500">½</span>}
                          </td>
                          <td className="px-5 py-3 font-mono font-bold tabular-nums">{l.appliedDays}</td>
                          <td className="px-5 py-3 text-xs text-gray-500 max-w-[200px] truncate">{l.reason || "—"}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${STATUS_BADGE[l.status] || ""}`}>
                              {l.status}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {canCancel && (
                              <button onClick={() => handleCancel(l.id)} disabled={actionLoading === l.id}
                                className="text-xs font-bold text-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors disabled:opacity-50 flex items-center gap-1">
                                {actionLoading === l.id ? "..." : <><Ban size={12} /> Cancel</>}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                {leaves.map((l) => {
                  const canCancel = (l.status === "PENDING" || l.status === "APPROVED") && new Date(l.startDate) > new Date();
                  const c = TYPE_COLORS[l.leaveTypeCode] || defaultColor;
                  return (
                    <div key={l.id} className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${c.bg} ${c.text}`}>{l.leaveTypeCode}</span>
                          <span className="text-sm font-bold">{l.appliedDays} Days</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${STATUS_BADGE[l.status] || ""}`}>
                          {l.status}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500">{l.startDate} to {l.endDate}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{l.reason || 'No reason provided'}"</p>
                      </div>
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(l.id)}
                          disabled={actionLoading === l.id}
                          className="w-full py-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold transition-all active:scale-95"
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Pending Approvals (Manager/Admin) ──────────────────── */}
      {activeTab === "approvals" && isManager && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <Shield size={16} className="text-indigo-500" /> Pending Approvals
            </h3>
          </div>
          {pendingLeaves.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <CheckCircle2 size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">All caught up! No pending approvals.</p>
            </div>
          ) : (
            <>
              <div className="max-md:hidden overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 font-mono text-[10px] uppercase tracking-widest">
                      <th className="px-5 py-3">Employee</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Dates</th>
                      <th className="px-5 py-3">Days</th>
                      <th className="px-5 py-3">Reason</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {pendingLeaves.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors text-gray-700 dark:text-gray-300">
                        <td className="px-5 py-3">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-xs">{l.fullName}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{l.employeeCode}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${(TYPE_COLORS[l.leaveTypeCode] || defaultColor).bg} ${(TYPE_COLORS[l.leaveTypeCode] || defaultColor).text}`}>
                            {l.leaveTypeCode}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs whitespace-nowrap">
                          {l.startDate}{l.startDate !== l.endDate && ` → ${l.endDate}`}
                          {l.halfDay && <span className="ml-1 text-[10px] text-amber-500">½</span>}
                        </td>
                        <td className="px-5 py-3 font-mono font-bold tabular-nums">{l.appliedDays}</td>
                        <td className="px-5 py-3 text-xs text-gray-500 max-w-[160px] truncate">{l.reason || "—"}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleApprove(l.id)} disabled={actionLoading === l.id}
                              className="px-3 py-1.5 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-50 flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 size={12} /> Approve
                            </button>
                            <button onClick={() => setShowRejectModal(l.id)} disabled={actionLoading === l.id}
                              className="px-3 py-1.5 text-xs font-bold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50 flex items-center gap-1 border border-red-200 dark:border-red-800">
                              <XCircle size={12} /> Reject
                            </button>
                            {isAdmin && (
                              <button onClick={() => handleRevoke(l.id)} disabled={actionLoading === l.id}
                                className="px-2 py-1.5 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50" title="Revoke (Admin)">
                                <Ban size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                {pendingLeaves.map((l) => (
                  <div key={l.id} className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{l.fullName}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{l.employeeCode}</p>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${(TYPE_COLORS[l.leaveTypeCode] || defaultColor).bg} ${(TYPE_COLORS[l.leaveTypeCode] || defaultColor).text}`}>
                        {l.leaveTypeCode}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                        {l.startDate}{l.startDate !== l.endDate && ` → ${l.endDate}`}
                        <span className="ml-2 text-indigo-500">{l.appliedDays} Days</span>
                        {l.halfDay && <span className="ml-1 text-[10px] text-amber-500">½</span>}
                      </p>
                      <p className="text-xs text-gray-500 italic">"{l.reason || 'No reason provided'}"</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button onClick={() => handleApprove(l.id)} disabled={actionLoading === l.id} className="py-2.5 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button onClick={() => setShowRejectModal(l.id)} disabled={actionLoading === l.id} className="py-2.5 text-xs font-bold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 border border-red-200 dark:border-red-800">
                        <XCircle size={14} /> Reject
                      </button>
                    </div>

                    {isAdmin && (
                      <button onClick={() => handleRevoke(l.id)} disabled={actionLoading === l.id} className="w-full py-2 mt-2 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        <Ban size={14} /> Revoke Request
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════ */}

      {showApplyModal && (
        <ApplyModal
          leaveTypes={leaveTypes}
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => { setShowApplyModal(false); showToast("success", "Leave applied successfully!"); }}
          onError={(msg) => showToast("error", msg)}
        />
      )}

      {showRejectModal !== null && (
        <RejectModal
          leaveId={showRejectModal}
          onClose={() => setShowRejectModal(null)}
          onSuccess={() => { setShowRejectModal(null); showToast("success", "Leave rejected."); }}
          onError={(msg) => showToast("error", msg)}
        />
      )}

      {showAuditModal && (
        <AuditModal onClose={() => setShowAuditModal(false)} />
      )}

      {showGrantModal && isAdmin && (
        <GrantModal
          leaveTypes={leaveTypes}
          onClose={() => setShowGrantModal(false)}
          onSuccess={() => { setShowGrantModal(false); showToast("success", "Leave granted successfully!"); }}
          onError={(msg) => showToast("error", msg)}
        />
      )}

      <ConfirmModal
        isOpen={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        title="Cancel Leave Request"
        message="Cancel this leave request and refund the balance back to the employee?"
        confirmText={cancelTarget !== null && actionLoading === cancelTarget ? "Cancelling..." : "Cancel Leave"}
      />

      <AppModal
        isOpen={revokeTarget !== null}
        onClose={() => {
          setRevokeTarget(null);
          setRevokeReason("");
        }}
        title="Revoke Approved Leave"
        description="Provide a clear reason so the audit trail stays complete and professional."
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setRevokeTarget(null);
                setRevokeReason("");
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmRevoke}
              disabled={!revokeReason.trim() || (revokeTarget !== null && actionLoading === revokeTarget)}
              className="rounded-xl bg-red-500 px-5 py-2 text-sm font-bold text-white shadow-sm shadow-red-500/20 transition-all hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {revokeTarget !== null && actionLoading === revokeTarget ? "Revoking..." : "Revoke Leave"}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Revocation Reason
          </label>
          <textarea
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            rows={4}
            placeholder="Explain why this approved leave is being revoked."
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-500/10 dark:border-gray-700 dark:bg-gray-800"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This note is required and will be part of the approval history.
          </p>
        </div>
      </AppModal>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
//  APPLY MODAL — with Half-Day Lock + Live Preview
// ═══════════════════════════════════════════════════════════════════
function ApplyModal({ leaveTypes, onClose, onSuccess, onError }: {
  leaveTypes: LeaveTypeDTO[];
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState<LeaveApplyRequest>({
    leaveTypeId: leaveTypes[0]?.id || 0,
    startDate: "",
    endDate: "",
    reason: "",
    halfDay: false,
    halfDaySession: "FIRST_HALF",
    attachmentUrl: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<LeavePreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const applyMutation = useApplyLeave();

  // 1. Half-Day Date Sync Lock
  function handleHalfDayToggle(val: boolean) {
    setForm(prev => ({
      ...prev,
      halfDay: val,
      endDate: val ? prev.startDate : prev.endDate
    }));
  }

  function handleStartDateChange(val: string) {
    setForm(prev => ({
      ...prev,
      startDate: val,
      endDate: prev.halfDay ? val : prev.endDate
    }));
  }

  // 2. Debounced Preview Call
  useEffect(() => {
    if (!form.startDate || !form.endDate || !form.leaveTypeId) {
      setPreview(null);
      return;
    }

    const handler = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await previewLeave(form);
        setPreview(res);
      } catch (err) {
        console.error("Preview failed", err);
      } finally {
        setPreviewLoading(false);
      }
    }, 600);

    return () => clearTimeout(handler);
  }, [form.startDate, form.endDate, form.leaveTypeId, form.halfDay]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.halfDay && !form.halfDaySession) {
      onError("Please select half-day session.");
      return;
    }
    setSubmitting(true);
    try {
      await applyMutation.mutateAsync(form);
      onSuccess();
    } catch (err: any) {
      onError(err?.response?.data?.message || "Application failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const labelCls = "block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5";
  const hasErrors = preview && preview.warnings && preview.warnings.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity duration-300" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-950 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/10 w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="relative p-8 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/10">
                <Palmtree size={24} className="text-white fill-white/10" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">Apply for Leave</h2>
                <p className="text-indigo-100/70 text-xs font-medium uppercase tracking-[0.15em] mt-0.5">Request Time Off</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">

          {/* Leave Type & Half-Day */}
          <section className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={labelCls}>Select Leave Type</label>
                <div className="relative group">
                  <select
                    value={form.leaveTypeId}
                    onChange={(e) => setForm({ ...form, leaveTypeId: Number(e.target.value) })}
                    className="input-base pr-10 appearance-none bg-gray-50 dark:bg-gray-900 text-sm font-semibold"
                    required
                  >
                    {leaveTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.halfDay ? "bg-amber-500/10 text-amber-500" : "bg-gray-200 dark:bg-gray-800 text-gray-400"}`}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Partial Day</span>
                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Enable for 0.5 day leave</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.halfDay} onChange={(e) => handleHalfDayToggle(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                </label>
              </div>
            </div>
          </section>

          {/* Dates */}
          <section className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Starting From</label>
              <input type="date" value={form.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="input-base bg-gray-50 dark:bg-gray-900 font-semibold" required />
            </div>
            <div>
              <label className={labelCls}>Ending On</label>
              <input type="date" value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className={`input-base bg-gray-50 dark:bg-gray-900 font-semibold ${form.halfDay ? "opacity-40 cursor-not-allowed" : ""}`}
                disabled={form.halfDay}
                required />
            </div>
          </section>

          {form.halfDay && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className={labelCls}>Which Session?</label>
              <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-900 p-1.5 rounded-xl border border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setForm({ ...form, halfDaySession: "FIRST_HALF" })}
                  className={`py-2 text-[10px] font-black uppercase rounded-lg transition-all ${form.halfDaySession === "FIRST_HALF" ? "bg-white dark:bg-gray-800 text-amber-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                  First Half
                </button>
                <button type="button" onClick={() => setForm({ ...form, halfDaySession: "SECOND_HALF" })}
                  className={`py-2 text-[10px] font-black uppercase rounded-lg transition-all ${form.halfDaySession === "SECOND_HALF" ? "bg-white dark:bg-gray-800 text-amber-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                  Second Half
                </button>
              </div>
            </div>
          )}

          {/* Preview Panel */}
          {(form.startDate && form.endDate) && (
            <div className={`rounded-3xl border-2 p-5 transition-all duration-300 relative overflow-hidden ${previewLoading
                ? "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30"
                : hasErrors
                  ? "border-amber-200/50 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/20"
                  : "border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-inner"
              }`}>
              {previewLoading ? (
                <div className="flex items-center justify-center gap-3 py-4 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                  <div className="w-4 h-4 border-[3px] border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
                  Calculating...
                </div>
              ) : preview ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">{preview.appliedDays}</span>
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Days</span>
                      </div>
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1 italic">Backend Math Applied</p>
                    </div>

                    <div className="text-right bg-white dark:bg-gray-800 p-3 rounded-2xl border border-white dark:border-gray-700 shadow-sm">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Projected Balance</p>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs font-bold text-gray-500">{preview.currentBalance}</span>
                        <ArrowDownCircle size={14} className="text-indigo-400" />
                        <span className={`text-lg font-black tabular-nums ${preview.balanceAfterDeduction < 0 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {preview.balanceAfterDeduction}
                        </span>
                      </div>
                    </div>
                  </div>

                  {preview.warnings.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-amber-200 dark:border-amber-800/40">
                      {preview.warnings.map((w: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-[10px]">
                          <AlertCircle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="text-amber-700 dark:text-amber-400 font-bold uppercase tracking-tighter leading-tight">{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Reason & Final Actions */}
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Purpose of Leave</label>
              <textarea
                value={form.reason || ""}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="input-base min-h-[100px] bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-sm"
                placeholder="Brief reason for your absence..."
              />
            </div>
          </div>
        </form>

        <div className="p-8 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 flex items-center justify-between">
          <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">Discard</button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting || (previewLoading && !preview)}
            className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white font-black rounded-2xl text-sm shadow-xl shadow-indigo-600/20 transition-all flex items-center gap-3"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 size={18} />
            )}
            {submitting ? "Sending..." : "Apply Now"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
//  REJECT MODAL
// ═══════════════════════════════════════════════════════════════════
function RejectModal({ leaveId, onClose, onSuccess, onError }: {
  leaveId: number; onClose: () => void; onSuccess: () => void; onError: (msg: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const rejectMutation = useRejectLeave();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await rejectMutation.mutateAsync({ leaveId, data: { rejectionReason: reason } });
      onSuccess();
    } catch (err: any) {
      onError(err?.response?.data?.message || "Reject failed.");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
            <XCircle size={18} /> Reject Leave #{leaveId}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-mono font-medium text-gray-500 uppercase tracking-widest mb-1.5">Rejection Reason *</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="input-base min-h-[100px] resize-none" required placeholder="Reason for rejection (required)..." />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-500">Cancel</button>
            <button type="submit" disabled={submitting || !reason.trim()}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-lg transition-all disabled:opacity-50">
              {submitting ? "Rejecting..." : "Reject Leave"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
//  AUDIT LEDGER MODAL
// ═══════════════════════════════════════════════════════════════════
function AuditModal({ onClose }: { onClose: () => void }) {
  const { data: audits = [], isLoading: loading } = useMyAuditTrail();

  const txIcon: Record<string, React.ReactNode> = {
    ACCRUAL: <ArrowDownCircle size={14} className="text-emerald-500" />,
    DEDUCTION: <ArrowUpCircle size={14} className="text-red-500" />,
    REFUND: <ArrowDownCircle size={14} className="text-sky-500" />,
    CARRY_FORWARD: <ArrowDownCircle size={14} className="text-indigo-500" />,
    EXPIRY: <ArrowUpCircle size={14} className="text-gray-400" />,
    MANUAL_ADJUSTMENT: <ArrowDownCircle size={14} className="text-amber-500" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText size={18} className="text-indigo-500" /> Balance Ledger
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="text-center text-gray-400 py-8 font-mono text-sm">Loading audit trail...</div>
          ) : audits.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">No transactions found</div>
          ) : (
            <div className="space-y-2">
              {audits.map((a) => (
                <div key={a.id} className="flex items-start gap-3 py-3 border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 rounded-lg px-2 transition-colors">
                  <div className="mt-0.5 flex-shrink-0">{txIcon[a.transactionType] || <Clock size={14} />}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{a.transactionType}</span>
                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${(TYPE_COLORS[a.leaveTypeCode] || defaultColor).bg} ${(TYPE_COLORS[a.leaveTypeCode] || defaultColor).text}`}>
                        {a.leaveTypeCode}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{a.reason}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                      {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-sm font-black tabular-nums ${a.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                      {a.amount > 0 ? "+" : ""}{a.amount}
                    </span>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">bal: {a.balanceAfter}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
//  GRANT LEAVE MODAL (Admin)
// ═══════════════════════════════════════════════════════════════════
function GrantModal({ leaveTypes, onClose, onSuccess, onError }: {
  leaveTypes: LeaveTypeDTO[];
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState<LeaveGrantRequest>({
    employeeId: 0, leaveTypeId: leaveTypes[0]?.id || 0, amount: 1, reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const grantMutation = useGrantLeave();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await grantMutation.mutateAsync(form);
      onSuccess();
    } catch (err: any) {
      onError(err?.response?.data?.message || "Grant failed.");
    } finally { setSubmitting(false); }
  }

  const labelCls = "block text-[10px] font-mono font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <Gift size={18} /> Manual Leave Grant
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className={labelCls}>Employee ID *</label>
            <input type="number" value={form.employeeId || ""} onChange={(e) => setForm({ ...form, employeeId: Number(e.target.value) })}
              className="input-base" required placeholder="e.g. 2" min="1" />
          </div>
          <div>
            <label className={labelCls}>Leave Type *</label>
            <select value={form.leaveTypeId} onChange={(e) => setForm({ ...form, leaveTypeId: Number(e.target.value) })} className="input-base" required>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Days to Grant *</label>
            <input type="number" step="0.5" min="0.5" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              className="input-base" required />
          </div>
          <div>
            <label className={labelCls}>Reason *</label>
            <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="input-base min-h-[80px] resize-none" required placeholder="Required reason for audit trail..." />
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-500">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-lg transition-all disabled:opacity-50">
              {submitting ? "Granting..." : "Grant Leave"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


