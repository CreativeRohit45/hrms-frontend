import { useEffect, useState } from "react";
import { getLeaveTypes } from "../../api/leaves";
import type { LeaveTypeDTO } from "../../types/leave";
import { 
  Settings, 
  RotateCw, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  CalendarDays
} from "lucide-react";
import apiClient from "../../api/axios";

export default function LeaveSettings() {
  const [types, setTypes] = useState<LeaveTypeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [accrualLoading, setAccrualLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    fetchTypes();
  }, []);

  async function fetchTypes() {
    try {
      const data = await getLeaveTypes();
      setTypes(data);
    } catch (err) {
      console.error("Failed to fetch leave types", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRunAccrual() {
    if (!confirm("This will trigger the monthly leave credit for all active employees. Are you sure?")) return;
    setAccrualLoading(true);
    setStatus(null);
    try {
      await apiClient.post("/api/v1/leaves/admin/accrual/run");
      setStatus({ type: "success", msg: "Monthly accrual processed successfully!" });
    } catch (err: any) {
      setStatus({ type: "error", msg: err?.response?.data?.message || "Accrual failed. It might have already run today." });
    } finally {
      setAccrualLoading(false);
    }
  }

  if (loading) return <div className="p-12 animate-pulse font-mono flex items-center justify-center text-gray-400">Loading Configuration...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Settings className="text-indigo-500" size={28} />
            Leave Engine Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Configure accrual logic, policies, and manual triggers</p>
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
          status.type === "success" 
            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300" 
            : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
        }`}>
          {status.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-bold">{status.msg}</span>
          <button onClick={() => setStatus(null)} className="ml-auto opacity-50 hover:opacity-100 font-black">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Global Triggers */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 border-l-4 border-indigo-600">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Accrual Engine</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <RotateCw size={20} className={accrualLoading ? "animate-spin" : ""} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold dark:text-white">Manual Run</h4>
                    <p className="text-[10px] text-gray-500 font-medium">Trigger monthly credits now</p>
                  </div>
                </div>
                <button 
                  onClick={handleRunAccrual}
                  disabled={accrualLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                  {accrualLoading ? "Processing..." : "Execute Accrual"}
                </button>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/10 rounded-2xl border border-amber-100 dark:border-amber-900/40">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="text-amber-600 mt-1 flex-shrink-0" size={18} />
                  <div>
                    <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400">Idempotency Guard</h4>
                    <p className="text-[10px] text-amber-700 dark:text-amber-500/80 mt-1 leading-relaxed">
                      This system prevents double-crediting. If you run it twice on the same day, the second attempt will be blocked.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Financial Controls</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400 mb-2 block">Payroll Lock Date</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="date" className="input-base pl-10 text-xs font-bold" defaultValue="2026-03-31" />
                  </div>
                  <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors">Lock</button>
                </div>
                <p className="text-[9px] text-gray-400 mt-2 italic">Cancellations before this date will be restricted.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Leave Types List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold dark:text-white text-sm">Leave Bucket Configuration</h3>
              <button disabled className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold flex items-center gap-2 opacity-50 cursor-not-allowed">
                <Plus size={14} /> New Type
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 font-mono text-[10px] uppercase tracking-widest">
                    <th className="px-6 py-4">Type / Code</th>
                    <th className="px-6 py-4 text-center">Annual / Accrual</th>
                    <th className="px-6 py-4 text-center">Policies</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {types.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-black text-xs text-gray-500">
                            {t.code}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{t.name}</p>
                            <span className={`text-[10px] font-black tracking-widest ${t.paid ? "text-emerald-500" : "text-amber-500"}`}>
                              {t.paid ? "PAID" : "UNPAID"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="inline-flex flex-col">
                          <span className="text-sm font-black text-gray-900 dark:text-white">{t.defaultAnnualQuota}d</span>
                          <span className="text-[10px] text-gray-400 font-bold">+{t.monthlyAccrualRate}/mo</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap justify-center gap-1.5 max-w-[150px] mx-auto">
                          {t.carryForwardAllowed && <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900 uppercase">CarryFW</span>}
                          {t.requiresAttachment && <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900 uppercase">Attach</span>}
                          {t.allowNegativeBalance && <span className="bg-red-50 dark:bg-red-950/40 text-red-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900 uppercase">Negative</span>}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex px-2 py-1 rounded-full text-[9px] font-black tracking-tighter shadow-sm border ${
                          t.active 
                            ? "bg-emerald-500 text-white border-emerald-400" 
                            : "bg-gray-400 text-white border-gray-300"
                        }`}>
                          {t.active ? "ACTIVE" : "DISABLED"}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button className="text-gray-400 hover:text-indigo-600 p-2 transition-colors">
                          <Settings size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
