import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, Calendar, Clock, MapPin,
  ArrowRight, CheckCircle2, XCircle,
  ArrowUpRight, Palmtree, Ticket,
  AlertCircle, ChevronRight, X, ChevronDown,
  ArrowDownCircle
} from "lucide-react";
import { useAppToast } from "../../components/ui/ToastProvider";
import api from "../../api/axios";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { AppModal } from "../../components/ui/AppModal";

interface Request {
  id: number;
  type: "LEAVE" | "GATEPASS";
  details: string;
  status: string;
  timestamp: string;
  metadata?: any;
}

export default function MyRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showGatepassModal, setShowGatepassModal] = useState(false);
  const { pushToast } = useAppToast();

  const fetchMyRequests = useCallback(async () => {
    setLoading(true);
    try {
      const [leaves, gatepasses] = await Promise.all([
        api.get("/api/v1/leaves/my-requests"),
        api.get("/api/v1/gatepasses/my")
      ]);

      const leavesData = leaves.data || [];
      const gatepassesData = gatepasses.data || [];

      const normalized: Request[] = [
        ...leavesData.map((l: any) => ({
          id: l.id,
          type: "LEAVE",
          details: `${l.leaveTypeName}: ${l.startDate} to ${l.endDate}`,
          status: l.status,
          timestamp: l.createdAt || new Date().toISOString(),
          metadata: l
        })),
        ...gatepassesData.map((g: any) => ({
          id: g.id,
          type: "GATEPASS",
          details: `${g.gatepassType}: ${new Date(g.requestedOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} transit`,
          status: g.status,
          timestamp: g.createdAt || new Date().toISOString(),
          metadata: g
        }))
      ];

      setRequests(normalized.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (error) {
      pushToast({ title: "Sync Error", message: "Failed to load your requests", tone: "error" });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  const getStatusTone = (status: string): "neutral" | "success" | "warning" | "danger" | "info" => {
    if (status === "APPROVED") return "success";
    if (status === "REJECTED") return "danger";
    if (status === "CANCELLED") return "neutral";
    return "warning";
  };

  const handleOpenLeave = () => {
    pushToast({ title: "Opening Form", message: "Syncing Leave Application Drawer...", tone: "info" });
    setShowLeaveModal(true);
  };

  const handleOpenGatepass = () => {
    pushToast({ title: "Opening Form", message: "Syncing Gatepass Request Drawer...", tone: "info" });
    setShowGatepassModal(true);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-20">
      {/* 🟢 TOP-LEVEL MODAL PORTAL (Relocated for stacking assurance) */}
      <div className="relative z-[1000]">
        {showLeaveModal && (
          <LeaveApplyModal
            onClose={() => setShowLeaveModal(false)}
            onSuccess={() => { setShowLeaveModal(false); fetchMyRequests(); }}
          />
        )}

        {showGatepassModal && (
          <GatepassApplyModal
            onClose={() => setShowGatepassModal(false)}
            onSuccess={() => { setShowGatepassModal(false); fetchMyRequests(); }}
          />
        )}
      </div>

      {/* HERO SECTION */}
      <div className="relative overflow-hidden rounded-[3rem] bg-indigo-600 p-8 text-white md:p-12">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight">My Requests Hub</h1>
            <p className="max-w-md text-indigo-100/80">Track your leaves and gatepass requests in real-time. Apply for new exemptions using the quick-actions below.</p>
          </div>

          <div className="flex gap-4">
            <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-md border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Active Leaves</p>
              <p className="mt-1 text-2xl font-black">{requests.filter(r => r.type === 'LEAVE' && r.status === 'APPROVED').length}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-md border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Pending</p>
              <p className="mt-1 text-2xl font-black">{requests.filter(r => r.status === 'PENDING').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS - Using Button elements for standard event handling */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* LEAVE CARD */}
        <button
          onClick={handleOpenLeave}
          className="group relative flex w-full flex-col overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white text-left transition-all hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/10 active:scale-[0.98] dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex flex-col gap-6 p-7">
            <div className="flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                <Palmtree className="h-7 w-7 pointer-events-none" />
              </div>
              <div className="rounded-full bg-blue-600 p-3 text-white shadow-lg shadow-blue-200 transition-all group-hover:bg-blue-700 group-hover:rotate-90 dark:shadow-blue-900/20">
                <Plus className="h-6 w-6 pointer-events-none" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Apply for Leave</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Plan your time off with automatic balance tracking</p>
            </div>
          </div>
        </button>

        {/* GATEPASS CARD */}
        <button
          onClick={handleOpenGatepass}
          className="group relative flex w-full flex-col overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white text-left transition-all hover:border-orange-200 hover:shadow-2xl hover:shadow-orange-500/10 active:scale-[0.98] dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex flex-col gap-6 p-7">
            <div className="flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/40">
                <Ticket className="h-7 w-7 pointer-events-none" />
              </div>
              <div className="rounded-full bg-orange-600 p-3 text-white shadow-lg shadow-orange-200 transition-all group-hover:bg-orange-700 group-hover:rotate-90 dark:shadow-orange-900/20">
                <Plus className="h-6 w-6 pointer-events-none" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Request Gatepass</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Official or personal building transit permissions</p>
            </div>
          </div>
        </button>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black flex items-center gap-2">
            Recent Activity
            <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-black text-gray-500 dark:bg-gray-800 uppercase tracking-widest">{requests.length}</span>
          </h2>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 w-full animate-pulse rounded-[2rem] bg-gray-50 dark:bg-gray-800/50" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-gray-200 py-20 dark:border-gray-800">
            <AlertCircle className="h-10 w-10 text-gray-300 pointer-events-none" />
            <p className="mt-4 text-sm font-medium text-gray-500">No requests found in your history.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={`${req.type}-${req.id}`}
                className="group flex flex-col gap-4 rounded-[2rem] border border-gray-100 bg-white p-5 transition-all hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 md:flex-row md:items-center dark:border-gray-800 dark:bg-gray-900"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${req.type === 'LEAVE' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30' : 'bg-orange-50 text-orange-600 dark:bg-orange-950/30'
                  }`}>
                  {req.type === 'LEAVE' ? <Palmtree className="h-6 w-6 pointer-events-none" /> : <Ticket className="h-6 w-6 pointer-events-none" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">{req.type}</span>
                    <span className="h-1 w-1 rounded-full bg-gray-300" />
                    <span className="text-[10px] font-bold text-gray-500">{new Date(req.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <h4 className="mt-0.5 font-bold text-gray-900 dark:text-white">{req.details}</h4>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6">
                  <StatusBadge label={req.status} tone={getStatusTone(req.status)} />
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- MINIMALIST LEAVE MODAL ---
function LeaveApplyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [types, setTypes] = useState<any[]>([]);
  const [form, setForm] = useState({ leaveTypeId: 0, startDate: "", endDate: "", reason: "" });
  const [loading, setLoading] = useState(false);
  const { pushToast } = useAppToast();

  useEffect(() => {
    api.get("/api/v1/leaves/types").then(res => {
      setTypes(res.data);
      if (res.data.length > 0) setForm(f => ({ ...f, leaveTypeId: res.data[0].id }));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/v1/leaves", form);
      pushToast({ title: "Success", message: "Leave applied successfully!", tone: "success" });
      onSuccess();
    } catch (err: any) {
      pushToast({ title: "Error", message: err.response?.data?.message || "Failed to apply", tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal isOpen={true} onClose={onClose} title="Apply for Leave" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6 py-4">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Leave Type</label>
            <div className="relative">
              <select
                value={form.leaveTypeId}
                onChange={e => setForm({ ...form, leaveTypeId: Number(e.target.value) })}
                className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
              >
                {types.map(t => <option key={t.id} value={t.id} className="dark:bg-gray-900">{t.name}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Start Date</label>
            <input
              type="date"
              required
              value={form.startDate}
              onChange={e => setForm({ ...form, startDate: e.target.value })}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">End Date</label>
            <input
              type="date"
              required
              value={form.endDate}
              onChange={e => setForm({ ...form, endDate: e.target.value })}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reason</label>
          <textarea
            required
            rows={3}
            value={form.reason}
            onChange={e => setForm({ ...form, reason: e.target.value })}
            className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            placeholder="Brief details about your leave..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Discard</button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-indigo-600 px-8 py-3 text-sm font-black text-white shadow-xl shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Apply Now"}
          </button>
        </div>
      </form>
    </AppModal>
  );
}

// --- MINIMALIST GATEPASS MODAL ---
function GatepassApplyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ requestedOutTime: "", requestedInTime: "", gatepassType: "OFFICIAL", reason: "" });
  const [loading, setLoading] = useState(false);
  const { pushToast } = useAppToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/v1/gatepasses/apply", form);
      pushToast({ title: "Success", message: "Gatepass request sent!", tone: "success" });
      onSuccess();
    } catch (err: any) {
      pushToast({ title: "Error", message: err.response?.data?.message || "Failed to submit", tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal isOpen={true} onClose={onClose} title="Request Gatepass" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setForm({ ...form, gatepassType: "OFFICIAL" })}
            className={`rounded-2xl border-2 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${form.gatepassType === "OFFICIAL" ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "border-gray-100 bg-gray-50 text-gray-400 dark:border-gray-800 dark:bg-gray-800"
              }`}
          >
            Official
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, gatepassType: "PERSONAL" })}
            className={`rounded-2xl border-2 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${form.gatepassType === "PERSONAL" ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "border-gray-100 bg-gray-50 text-gray-400 dark:border-gray-800 dark:bg-gray-900"
              }`}
          >
            Personal
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Exit Time</label>
            <input
              type="datetime-local"
              required
              value={form.requestedOutTime}
              onChange={e => setForm({ ...form, requestedOutTime: e.target.value })}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold outline-none focus:border-orange-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Return Time</label>
            <input
              type="datetime-local"
              required
              value={form.requestedInTime}
              onChange={e => setForm({ ...form, requestedInTime: e.target.value })}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold outline-none focus:border-orange-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reason</label>
          <textarea
            required
            rows={2}
            value={form.reason}
            onChange={e => setForm({ ...form, reason: e.target.value })}
            className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium outline-none focus:border-orange-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            placeholder="Details about your transit..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Discard</button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-orange-600 px-8 py-3 text-sm font-black text-white shadow-xl shadow-orange-600/20 transition-all hover:bg-orange-700 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Request Now"}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
