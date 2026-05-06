import { useState } from "react";
import { 
  Calculator, Lock, FileText, 
  Users, IndianRupee, Timer, Edit3, RotateCcw
} from "lucide-react";
import type { PayslipResponse } from "../../types/payroll";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { SelectField } from "../../components/ui/SelectField";
import { useAppToast } from "../../components/ui/ToastProvider";
import {
  useCompanyPayroll,
  useGeneratePayrollBulk,
  useLockPayroll,
  useRecalculateRecord,
} from "../../hooks/queries/usePayroll";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = [2024, 2025, 2026];

import PayrollAdjustmentModal from "./PayrollAdjustmentModal";

export default function AdminPayroll() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showLockModal, setShowLockModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayslipResponse | null>(null);

  const { pushToast } = useAppToast();

  // ── TanStack Query — declarative data layer ────────────────────
  // keepPreviousData prevents the "Ghost Data" flash when switching months
  const { data: records = [], isLoading: loading, isFetching } = useCompanyPayroll(month, year);

  const generateMutation = useGeneratePayrollBulk();
  const lockMutation = useLockPayroll();
  const recalcMutation = useRecalculateRecord(month, year);

  const actionLoading = generateMutation.isPending || lockMutation.isPending || recalcMutation.isPending;

  const isLocked = Array.isArray(records) && records.some((r: PayslipResponse) => r.status === "LOCKED" || r.status === "PAID");

  const handleRunPayroll = async () => {
    try {
      await generateMutation.mutateAsync({ month, year });
      pushToast({ title: "Payroll Generated", message: `Payroll generated successfully for ${MONTHS[month - 1]} ${year}`, tone: "success" });
    } catch (err: any) {
      pushToast({ title: "Generation Failed", message: err?.response?.data?.message || "Generation failed", tone: "error" });
    }
  };

  const handleLockPayroll = async () => {
    try {
      await lockMutation.mutateAsync({ month, year });
      pushToast({ title: "Payroll Locked", message: "Payroll locked and finalized.", tone: "success" });
    } catch (err: any) {
      pushToast({ title: "Lock Failed", message: err?.response?.data?.message || "Locking failed", tone: "error" });
    }
  };

  const handleRecalculate = async (recordId: number) => {
    try {
      await recalcMutation.mutateAsync(recordId);
      pushToast({ title: "Recalculated", message: "Record recalculated successfully.", tone: "success" });
    } catch (err: any) {
      pushToast({ title: "Recalculation Failed", message: err?.response?.data?.message || "Recalculation failed", tone: "error" });
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
          <div className="flex items-center gap-2">
            <div className="w-40">
              <SelectField
                compact
                value={String(month)}
                onChange={(v) => setMonth(parseInt(v))}
                options={MONTHS.map((m, i) => ({ label: m, value: String(i + 1) }))}
              />
            </div>
            <div className="w-28">
              <SelectField
                compact
                value={String(year)}
                onChange={(v) => setYear(parseInt(v))}
                options={YEARS.map(y => ({ label: String(y), value: String(y) }))}
              />
            </div>
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
        <div className={`bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-opacity duration-300 ${isFetching ? 'opacity-60' : ''}`}>
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

        <div className={`bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-opacity duration-300 ${isFetching ? 'opacity-60' : ''}`}>
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

        <div className={`bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-opacity duration-300 ${isFetching ? 'opacity-60' : ''}`}>
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
      <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm transition-opacity duration-300 ${isFetching ? 'opacity-70' : ''}`}>
        <div className="max-md:hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Base Salary</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Net Days</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">LWP Days</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Deductions</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Adjustments</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Net Payout</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Actions</th>
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
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">₹{(r.grossPay ?? 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{r.presentDays}</span>
                  </td>
                  <td className="px-6 py-4 text-center font-mono">
                    <span className={r.absentDays > 0 ? "text-amber-600 font-bold" : "text-gray-400"}>{r.absentDays}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-rose-500 font-bold">₹{(r.totalDeductions ?? 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-sm font-bold ${(r.totalAdjustmentAmount ?? 0) > 0 ? "text-emerald-500" : (r.totalAdjustmentAmount ?? 0) < 0 ? "text-rose-500" : "text-gray-400"}`}>
                      {(r.totalAdjustmentAmount ?? 0) > 0 ? "+" : ""}{(r.totalAdjustmentAmount ?? 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-black text-gray-900 dark:text-white">₹{(r.netPay ?? 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                       <button 
                         onClick={() => { setSelectedRecord(r); setShowAdjustmentModal(true); }}
                         disabled={r.status === 'LOCKED' || r.status === 'PAID'}
                         className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-600 rounded-lg transition-colors disabled:opacity-30"
                         title="Edit Adjustments"
                       >
                         <Edit3 size={16} />
                       </button>
                       <button 
                         onClick={() => handleRecalculate(r.recordId)}
                         disabled={r.status === 'LOCKED' || r.status === 'PAID' || actionLoading}
                         className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-500 rounded-lg transition-colors disabled:opacity-30"
                         title="Recalculate Record"
                       >
                         <RotateCcw size={16} className={recalcMutation.isPending ? "animate-spin" : ""} />
                       </button>
                    </div>
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
                     {(r.fullName || "N").charAt(0)}
                   </div>
                   <div>
                     <p className="font-bold text-gray-900 dark:text-white text-sm leading-none">{r.fullName || "Unnamed Employee"}</p>
                     <p className="text-[10px] text-gray-400 font-mono mt-1">{r.employeeCode || "---"}</p>
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
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">₹{(r.grossPay ?? 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Deductions</p>
                    <p className="text-sm font-bold text-rose-500">₹{(r.totalDeductions ?? 0).toLocaleString()}</p>
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
                  <p className="text-xl font-black text-gray-900 dark:text-white leading-none">₹{(r.netPay ?? 0).toLocaleString()}</p>
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
      {selectedRecord && (
        <PayrollAdjustmentModal
          isOpen={showAdjustmentModal}
          onClose={() => { setShowAdjustmentModal(false); setSelectedRecord(null); }}
          record={selectedRecord}
          month={month}
          year={year}
        />
      )}

      <ConfirmModal 
        isOpen={showRunModal}
        onClose={() => setShowRunModal(false)}
        onConfirm={handleRunPayroll}
        title="Run Payroll Calculation?"
        message={`This will trigger the calculation engine for ${records.length ? 're-evaluating' : 'generating'} ${MONTHS[month - 1]} ${year} payroll. This may take a few moments.`}
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
    </div>
  );
}
