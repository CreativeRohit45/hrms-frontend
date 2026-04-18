import { useState, useEffect, useCallback } from "react";
import { 
  Calculator, Lock, CheckCircle2, AlertCircle, FileText, 
  Users, IndianRupee, Timer
} from "lucide-react";
import { getCompanyPayroll, generatePayrollBulk, lockPayroll } from "../../api/payroll";
import type { PayslipResponse } from "../../types/payroll";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = [2024, 2025, 2026];

export default function AdminPayroll() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<PayslipResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchPayrollData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCompanyPayroll(month, year);
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch payroll", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchPayrollData();
  }, [fetchPayrollData]);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const isLocked = Array.isArray(records) && records.some((r: PayslipResponse) => r.status === "LOCKED" || r.status === "PAID");

  const handleRunPayroll = async () => {
    setActionLoading(true);
    try {
      await generatePayrollBulk(month, year);
      showToast("success", `Payroll generated successfully for ${MONTHS[month - 1]} ${year}`);
      fetchPayrollData();
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Generation failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLockPayroll = async () => {
    setActionLoading(true);
    try {
      await lockPayroll(month, year);
      showToast("success", "Payroll locked and finalized.");
      fetchPayrollData();
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Locking failed");
    } finally {
      setActionLoading(false);
    }
  };

  const totalDisbursement = Array.isArray(records) ? records.reduce((acc: number, r: PayslipResponse) => acc + r.netPay, 0) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Payroll Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generate, review and finalize company-wide disbursements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-2 py-1 shadow-sm">
            <select 
              value={month} 
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="bg-transparent border-none text-sm font-semibold p-2 focus:ring-0 dark:text-white"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 my-auto mx-1" />
            <select 
              value={year} 
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="bg-transparent border-none text-sm font-semibold p-2 focus:ring-0 dark:text-white"
            >
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button 
            disabled={isLocked || actionLoading}
            onClick={() => setShowRunModal(true)}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all
              ${isLocked 
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed" 
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 active:scale-95"
              }
            `}
          >
            <Calculator size={18} />
            {actionLoading ? "Processing Engine..." : "Run Payroll Calculation"}
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center text-emerald-600">
              <IndianRupee size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Disbursement</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white">₹{totalDisbursement.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center text-indigo-600">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Employees Processed</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{records.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 rounded-xl flex items-center justify-center text-amber-500">
              {isLocked ? <Lock size={24} /> : <FileText size={24} />}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`h-2.5 w-2.5 rounded-full ${isLocked ? 'bg-amber-500' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                <p className="text-lg font-bold text-gray-900 dark:text-white">{isLocked ? "LOCKED" : "OPEN"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="max-md:hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Base Salary</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Net Days</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">LWP Days</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Deductions</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Net Payout</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
                      <p className="text-sm text-gray-400">Fetching payroll data...</p>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-50">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <FileText size={32} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No payroll data for this period.</p>
                      {!isLocked && (
                        <button onClick={() => setShowRunModal(true)} className="text-indigo-600 font-bold hover:underline">
                          Run calculation now
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : Array.isArray(records) && records.map((r: PayslipResponse) => (
                <tr key={r.recordId} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-xs text-gray-600 dark:text-gray-400">
                        {r.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">{r.fullName}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-1">{r.employeeCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">₹{r.grossPay.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{r.presentDays}</span>
                  </td>
                  <td className="px-6 py-4 text-center font-mono">
                    <span className={r.absentDays > 0 ? "text-amber-600 font-bold" : "text-gray-400"}>{r.absentDays}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-rose-500 font-bold">₹{r.totalDeductions.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-black text-gray-900 dark:text-white">₹{r.netPay.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      r.status === 'LOCKED' 
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' 
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* MOBILE CARDS */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              <div className="animate-pulse">Fetching payroll data...</div>
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <div className="opacity-50">No payroll data for this period.</div>
              {!isLocked && (
                <button onClick={() => setShowRunModal(true)} className="mt-4 text-indigo-600 font-bold">Run calculation now</button>
              )}
            </div>
          ) : Array.isArray(records) && records.map((r: PayslipResponse) => (
             <div key={r.recordId} className="p-5 space-y-4">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-black text-xs text-gray-600 dark:text-gray-400">
                     {r.fullName.charAt(0)}
                   </div>
                   <div>
                     <p className="font-bold text-gray-900 dark:text-white text-sm leading-none">{r.fullName}</p>
                     <p className="text-[10px] text-gray-400 font-mono mt-1">{r.employeeCode}</p>
                   </div>
                 </div>
                 <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      r.status === 'LOCKED' 
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' 
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                 }`}>
                   {r.status}
                 </span>
               </div>
               
               <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Base Salary</p>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">₹{r.grossPay.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Deductions</p>
                    <p className="text-sm font-bold text-rose-500">₹{r.totalDeductions.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Net Days / LWP</p>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {r.presentDays} <span className="font-normal text-gray-400 dark:text-gray-500 mx-1">/</span> <span className={r.absentDays > 0 ? "text-amber-500 font-bold" : "text-gray-400"}>{r.absentDays}</span>
                    </p>
                  </div>
               </div>
               
               <div className="flex items-end justify-between pt-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Net Payout</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white leading-none">₹{r.netPay.toLocaleString()}</p>
               </div>
             </div>
          ))}
        </div>
        
        {records.length > 0 && !isLocked && (
          <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex justify-end items-center">
            <button 
              disabled={actionLoading}
              onClick={() => setShowLockModal(true)}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {actionLoading ? <Timer className="animate-spin" size={16} /> : <Lock size={16} />}
              {actionLoading ? "Finalizing..." : "Finalize & Lock Payroll"}
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmModal 
        isOpen={showRunModal}
        onClose={() => setShowRunModal(false)}
        onConfirm={handleRunPayroll}
        title="Run Payroll Calculation?"
        message={`This will trigger the calculation engine for ${records.length ? 're-evaluating' : 'generating'} April 2026 payroll. This may take a few moments.`}
        confirmText="Start Calculation"
        isDestructive={false}
      />

      <ConfirmModal 
        isOpen={showLockModal}
        onClose={() => setShowLockModal(false)}
        onConfirm={handleLockPayroll}
        title="Finalize & Lock Payroll?"
        message="WARNING: Once locked, payroll cannot be re-calculated for this period. All records will be marked as READY FOR DISBURSEMENT."
        confirmText="Lock & Finalize"
        isDestructive={true}
      />

      {/* Floating Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-bold">{toast.msg}</p>
        </div>
      )}
    </div>
  );
}
