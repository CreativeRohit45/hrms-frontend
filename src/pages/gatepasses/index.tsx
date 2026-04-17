// src/pages/gatepasses/index.tsx — Gatepass Management Dashboard
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  applyGatepass,
  approveGatepass,
  rejectGatepass,
  cancelGatepass,
  markExit,
  markEntry,
  getMyGatepasses,
  getPendingGatepasses
} from "../../api/gatepass";
import type { GatepassResponse, GatepassApplyRequest } from "../../types/gatepass";
import {
  MapPin, Plus, X, Clock, CheckCircle2, XCircle, Ban,
  FileText, AlertCircle, ArrowRightLeft,
  ShieldCheck, UserCheck, Timer, LogOut, LogIn
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════
//  UI CONFIG
// ═══════════════════════════════════════════════════════════════════

const STATUS_BADGE: Record<string, string> = {
  PENDING:   "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  APPROVED:  "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  REJECTED:  "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800",
  CANCELLED: "bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

const TYPE_COLORS: Record<string, string> = {
  OFFICIAL: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-800",
  PERSONAL: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-800",
};

// ═══════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function GatepassPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "HR_ADMIN" || user?.role === "SUPER_ADMIN";
  const isManager = user?.role === "DEPARTMENT_MANAGER" || isAdmin;

  // Data state
  const [gatepasses, setGatepasses] = useState<GatepassResponse[]>([]);
  const [pendingRequests, setPendingRequests] = useState<GatepassResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState<"my" | "approvals">("my");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const my = await getMyGatepasses();
      setGatepasses(Array.isArray(my) ? my : []);
      if (isManager) {
        const pending = await getPendingGatepasses();
        setPendingRequests(Array.isArray(pending) ? pending : []);
      }
    } catch (err) {
      console.error("Gatepass data fetch failed", err);
      setGatepasses([]);
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Actions ──────────────────────────────────────────────────────

  async function handleAction(promise: Promise<any>, successMsg: string) {
    try {
      await promise;
      showToast("success", successMsg);
      fetchData();
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Action failed.");
    }
  }

  // Find the most relevant active gatepass for the employee (Only for TODAY)
  const todayStr = new Date().toISOString().split('T')[0];
  const activeGatepass = (gatepasses || []).find(g => 
    g.status === "APPROVED" && 
    g.actualInTime === null &&
    new Date(g.requestedOutTime).toISOString().startsWith(todayStr)
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64 animate-pulse">
      <div className="text-gray-400 dark:text-gray-500 font-mono text-sm uppercase tracking-widest">Initialising Gatepass Systems...</div>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12">

      {/* ── Toast ──────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 ${
          toast.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
            : "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100"><X size={14} /></button>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            Gatepass Management
            <span className="text-xs font-black uppercase tracking-[0.2em] bg-indigo-500 text-white px-3 py-1 rounded-full shadow-lg shadow-indigo-500/20">Module</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Temporary transit & geofence exemption control center.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowApplyModal(true)}
            className="group flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            Apply For Gatepass
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ── Left Column: History & Approvals ─────────────────── */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-gray-100/50 dark:bg-gray-900/50 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-800 w-fit">
            <button
              onClick={() => setActiveTab("my")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "my"
                  ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              My History
            </button>
            {isManager && (
              <button
                onClick={() => setActiveTab("approvals")}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === "approvals"
                    ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Approvals
                {pendingRequests.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="card shadow-2xl shadow-indigo-500/5">
            {/* DESKTOP TABLE */}
            <div className="max-md:hidden overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Type & Reason</th>
                    {activeTab === "approvals" && <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>}
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Planned Slot</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {(activeTab === "my" ? gatepasses : pendingRequests).map((g) => (
                    <tr key={g.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border w-fit ${TYPE_COLORS[g.gatepassType]}`}>
                            {g.gatepassType}
                          </span>
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-200 line-clamp-1">{g.reason}</span>
                        </div>
                      </td>
                      {activeTab === "approvals" && (
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                              {(g.fullName || "User").split(" ").map(n => n[0]).join("")}
                            </div>
                            <div className="text-xs">
                              <p className="font-bold text-gray-900 dark:text-white">{g.fullName}</p>
                              <p className="text-gray-400 font-mono text-[10px]">{g.employeeCode}</p>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-5">
                        <div className="flex flex-col text-xs">
                          <span className="text-gray-400 font-bold uppercase text-[9px] tracking-tighter">
                            {new Date(g.requestedOutTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="font-mono font-bold text-gray-600 dark:text-gray-300">
                            {new Date(g.requestedOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            <span className="mx-1.5 text-gray-300">→</span>
                            {new Date(g.requestedInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border tracking-widest ${STATUS_BADGE[g.status]}`}>
                          {g.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {activeTab === "my" ? (
                            <>
                              {g.status === "PENDING" && (
                                <button
                                  onClick={() => handleAction(cancelGatepass(g.id), "Request cancelled.")}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                                  title="Cancel Request"
                                >
                                  <Ban size={16} />
                                </button>
                              )}
                              <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-all">
                                <FileText size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleAction(approveGatepass(g.id), "Gatepass APPROVED.")}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black rounded-lg shadow-lg shadow-emerald-500/20 transition-all uppercase"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setRejectReason("");
                                  setShowRejectModal(g.id);
                                }}
                                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-[10px] font-black rounded-lg transition-all uppercase"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(activeTab === "my" ? gatepasses : pendingRequests).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-700">
                            <ArrowRightLeft size={24} />
                          </div>
                          <p className="text-sm text-gray-400 font-medium">No gatepass records found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                {(activeTab === "my" ? gatepasses : pendingRequests).length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-sm">No records found.</div>
                ) : (
                  (activeTab === "my" ? gatepasses : pendingRequests).map((g) => (
                    <div key={g.id} className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="flex flex-col gap-1">
                            {activeTab === "approvals" && <span className="text-xs font-bold text-gray-900 dark:text-white">{g.fullName}</span>}
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border w-fit ${TYPE_COLORS[g.gatepassType]}`}>
                              {g.gatepassType}
                            </span>
                         </div>
                         <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border tracking-widest ${STATUS_BADGE[g.status]}`}>
                            {g.status}
                         </span>
                      </div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300 line-clamp-2">"{g.reason}"</p>
                      <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-indigo-500" />
                          {new Date(g.requestedOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(g.requestedInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      
                      {activeTab === "my" ? (
                        g.status === "PENDING" && (
                          <button 
                            onClick={() => handleAction(cancelGatepass(g.id), "Request cancelled.")}
                            className="w-full py-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold active:scale-95"
                          >
                            Cancel Request
                          </button>
                        )
                      ) : (
                        <div className="flex gap-2">
                           <button 
                              onClick={() => handleAction(approveGatepass(g.id), "Gatepass APPROVED.")}
                              className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20"
                           >
                              Approve
                           </button>
                           <button 
                              onClick={() => { setRejectReason(""); setShowRejectModal(g.id); }}
                              className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold"
                           >
                              Reject
                           </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
            </div>
          </div>
        </div>

        {/* ── Right Column: Active Transit ─────────────────────── */}
        <div className="lg:col-span-4 space-y-8">
          
          <div className="card overflow-hidden group">
            <div className="p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-700">
                <MapPin size={80} />
              </div>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <ShieldCheck size={20} className="text-indigo-200" />
                Transit Status
              </h3>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Live Location Exemption</p>
            </div>

            <div className="p-8 space-y-6">
              {activeGatepass ? (
                <div className="space-y-6">
                  <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800/50">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${TYPE_COLORS[activeGatepass.gatepassType]}`}>
                        {activeGatepass.gatepassType} Gatepass
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Approved
                      </div>
                    </div>
                    <p className="text-xl font-black text-gray-900 dark:text-white line-clamp-2 leading-tight">
                      {activeGatepass.reason}
                    </p>
                    <div className="mt-4 flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-white dark:bg-gray-900/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                      <Clock size={12} className="text-indigo-500" />
                      Slot: {new Date(activeGatepass.requestedOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                      <span className="text-gray-200">—</span> 
                      {new Date(activeGatepass.requestedInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {activeGatepass.actualOutTime === null ? (
                    <button
                      onClick={() => handleAction(markExit(activeGatepass.id), "Exit recorded. Shift remains active.")}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rose-500/20 transition-all hover:-translate-y-1 active:scale-95 group"
                    >
                      <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                      Mark Building Exit
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                          <Timer size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Currently Outside Since</p>
                          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {new Date(activeGatepass.actualOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAction(markEntry(activeGatepass.id), "Entry recorded. Payroll deduction finalised.")}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-600/20 transition-all hover:-translate-y-1 active:scale-95 group"
                      >
                        <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                        Mark Building Entry
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 text-gray-200 dark:text-gray-800 rounded-[2.5rem] flex items-center justify-center mx-auto transition-transform group-hover:rotate-12 duration-500">
                    <UserCheck size={40} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Geofence Active</h4>
                    <p className="text-xs text-gray-400 font-medium px-6 py-2">No active gatepass found. You must remain in the office perimeter to maintain your attendance session.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card p-6 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-950/10 dark:to-transparent border-indigo-100 dark:border-indigo-800/40">
            <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4">Module Insights</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-bold">Official Trips</span>
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                  {gatepasses.filter(g => g.gatepassType === "OFFICIAL" && g.status === "APPROVED").length}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-bold">Personal Deductions</span>
                <span className="font-mono font-black text-rose-500">
                  {gatepasses.filter(g => g.gatepassType === "PERSONAL" && g.status === "APPROVED").length}
                </span>
              </div>
              <div className="pt-4 border-t border-indigo-100 dark:border-indigo-800/50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-500">
                  <AlertCircle size={16} />
                </div>
                <p className="text-[10px] text-orange-700 dark:text-orange-400 leading-tight font-bold">
                  Rule: Personal gatepass duration is deducted from your daily payable minutes at punch-out.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────── */}

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowApplyModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Gatepass Application</h3>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Request Geofence Exemption</p>
                </div>
                <button onClick={() => setShowApplyModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <ApplyForm onCancel={() => setShowApplyModal(false)} onSuccess={() => { setShowApplyModal(false); fetchData(); }} showToast={showToast} />
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowRejectModal(null); setRejectReason(""); }} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-red-100 dark:border-red-900/20 overflow-hidden">
             <div className="p-8">
                <div className="flex items-center gap-4 mb-6 text-red-600">
                  <XCircle size={32} />
                  <h3 className="text-xl font-black tracking-tight">Reject Application</h3>
                </div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Clearly state the reason for rejection..."
                  className="w-full bg-gray-50 dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-sm font-medium focus:border-red-500 outline-none transition-all h-32"
                />
                {!rejectReason.trim() && (
                  <p className="mt-3 text-xs font-semibold text-red-500">A rejection reason is required.</p>
                )}
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => { setShowRejectModal(null); setRejectReason(""); }}
                    className="flex-1 py-4 text-sm font-black text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!rejectReason.trim()) return;
                      handleAction(rejectGatepass(showRejectModal, { rejectionReason: rejectReason.trim() }), "Application rejected.");
                      setShowRejectModal(null);
                      setRejectReason("");
                    }}
                    className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black shadow-xl shadow-red-500/20 transition-all uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!rejectReason.trim()}
                  >
                    Confirm Rejection
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ApplyForm({ onCancel, onSuccess, showToast }: { onCancel: () => void; onSuccess: () => void; showToast: any }) {
  const [formData, setFormData] = useState<GatepassApplyRequest>({
    requestedOutTime: "",
    requestedInTime: "",
    gatepassType: "OFFICIAL",
    reason: ""
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.requestedOutTime || !formData.requestedInTime || !formData.reason) {
      return showToast("error", "Please fill all required fields.");
    }
    setLoading(true);
    try {
      await applyGatepass(formData);
      showToast("success", "Application submitted successfully.");
      onSuccess();
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Submission failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setFormData({...formData, gatepassType: "OFFICIAL"})}
          className={`px-4 py-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
            formData.gatepassType === "OFFICIAL"
              ? "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-105"
              : "border-gray-100 dark:border-gray-800 text-gray-400 bg-gray-50/50 dark:bg-gray-900/50"
          }`}
        >
          Official Business
        </button>
        <button
          type="button"
          onClick={() => setFormData({...formData, gatepassType: "PERSONAL"})}
          className={`px-4 py-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
            formData.gatepassType === "PERSONAL"
              ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20 scale-105"
              : "border-gray-100 dark:border-gray-800 text-gray-400 bg-gray-50/50 dark:bg-gray-900/50"
          }`}
        >
          Personal Errand
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Planned Exit</label>
          <div className="relative group">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input
              type="datetime-local"
              required
              className="w-full bg-gray-50 dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
              value={formData.requestedOutTime}
              onChange={(e) => setFormData({...formData, requestedOutTime: e.target.value})}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Planned Return</label>
          <div className="relative group">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input
              type="datetime-local"
              required
              className="w-full bg-gray-50 dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
              value={formData.requestedInTime}
              onChange={(e) => setFormData({...formData, requestedInTime: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason for Gatepass</label>
        <textarea
          required
          placeholder="Please provide details about your planned transit..."
          className="w-full bg-gray-50 dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-sm font-medium focus:border-indigo-500 outline-none transition-all h-24 dark:text-white"
          value={formData.reason}
          onChange={(e) => setFormData({...formData, reason: e.target.value})}
        />
      </div>

      {formData.gatepassType === "PERSONAL" && (
        <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-start gap-4">
          <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold leading-tight uppercase tracking-wider">
            NOTICE: As a Personal Gatepass, the actual duration of your time outside will be automatically deducted from your daily payable minutes at punch-out.
          </p>
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-4 text-sm font-black text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors uppercase tracking-widest"
        >
          Discard
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-[1.5rem] font-black shadow-xl shadow-indigo-600/20 transition-all uppercase tracking-widest"
        >
          {loading ? "Submitting..." : "Send Request"}
        </button>
      </div>
    </form>
  );
}

