// src/pages/payroll/MyPayslips.tsx
import { useState } from "react";
import {
  FileText, Eye, Calendar, IndianRupee,
  Printer, X, Download, Loader2,
  TrendingDown, TrendingUp,
  ChevronRight, ShieldCheck, CreditCard,
  History, ArrowRight,
  Wallet, AlertCircle,
} from "lucide-react";
import type { PayslipResponse } from "../../types/payroll";
import { useMyPayslips, usePayslipDetail, useDownloadPayslip } from "../../hooks/queries/usePayroll";
import { SelectField } from "../../components/ui/SelectField";

// ── Currency formatter ────────────────────────────────────────────
function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Status pill ───────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const isReady = status === "LOCKED" || status === "PAID";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest
        ${isReady
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800"
          : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-100 dark:border-amber-800"
        }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isReady ? "bg-emerald-500" : "bg-amber-500"}`} />
      {isReady ? "Processed" : status}
    </span>
  );
}

// ── Skeleton Components ───────────────────────────────────────────
function SkeletonHero() {
  return (
    <div className="animate-pulse rounded-[32px] bg-gray-100 dark:bg-gray-800/50 h-64 w-full" />
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse flex items-center gap-4 p-5 rounded-3xl border border-gray-100 dark:border-gray-800">
      <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="h-8 w-24 rounded-full bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function MyPayslips() {
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  const { data: payslips, isLoading: loading } = useMyPayslips();
  const { data: selectedPayslip, isLoading: detailLoading } = usePayslipDetail(selectedRecordId);
  const { mutate: downloadPdf, isPending: isDownloading } = useDownloadPayslip();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownload = (recordId: number) => {
    setDownloadingId(recordId);
    downloadPdf(recordId, {
      onSettled: () => setDownloadingId(null),
    });
  };

  const slips = (Array.isArray(payslips) ? payslips : []) as PayslipResponse[];
  const latestSlip = slips[0] || null;

  // Filter logic (if we want to group by year)
  const availableYears = Array.from(new Set(slips.map(s => s.period?.split(' ').pop() || yearFilter)));
  const yearOptions = availableYears.map(y => ({ label: y, value: y }));

  const filteredSlips = slips.filter(s => s.period?.includes(yearFilter));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 px-4 sm:px-6 md:px-10 pb-24 pt-4">

      {/* ── Page Title ────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
          Salary & Payments
        </h1>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Your earnings history and processed payslips
        </p>
      </div>

      {loading ? (
        <div className="space-y-8">
          <SkeletonHero />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonCard /><SkeletonCard />
          </div>
        </div>
      ) : !latestSlip ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-indigo-50 dark:bg-indigo-950/30 mb-6 shadow-xl shadow-indigo-500/10">
            <Wallet className="h-10 w-10 text-indigo-500" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
            No Payslips Found
          </h2>
          <p className="mt-2 max-w-xs text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
            Your payroll hasn't been processed yet. You'll see your first payslip here once it's finalized.
          </p>
        </div>
      ) : (
        <>
          {/* ── Premium Latest Payslip Hero ───────────────────── */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[36px] blur-xl opacity-20 group-hover:opacity-30 transition duration-1000"></div>
            <div className="relative rounded-[32px] border border-gray-100 dark:border-gray-800/50 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Left side: Main Stats */}
                <div className="p-8 md:p-10 bg-gray-50/50 dark:bg-gray-800/20 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Latest Payout</p>
                      <p className="text-lg font-black text-gray-900 dark:text-white leading-none">{latestSlip.period}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Net Salary Credited</p>
                    <p className="text-5xl md:text-6xl font-black tracking-[0.2em] text-gray-300 dark:text-gray-700 tabular-nums select-none">
                      ••••••
                    </p>
                  </div>

                  <div className="mt-10 flex items-center gap-4">
                    <button
                      onClick={() => setSelectedRecordId(latestSlip.recordId)}
                      className="flex-1 h-14 rounded-2xl bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-gray-900/10"
                    >
                      View Details
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(latestSlip.recordId)}
                      disabled={isDownloading && downloadingId === latestSlip.recordId}
                      className="h-14 w-14 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 transition-all hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95"
                    >
                      {isDownloading && downloadingId === latestSlip.recordId 
                        ? <Loader2 className="h-5 w-5 animate-spin" />
                        : <Download className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Right side: Insights */}
                <div className="p-8 md:p-10 flex flex-col justify-center gap-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-500">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Earnings</span>
                      </div>
                      <p className="text-2xl font-black tracking-widest text-gray-300 dark:text-gray-700 tabular-nums select-none">
                        ••••••
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-rose-500">
                        <TrendingDown className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Deductions</span>
                      </div>
                      <p className="text-2xl font-black tracking-widest text-gray-300 dark:text-gray-700 tabular-nums select-none">
                        ••••••
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                          <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-300">PF & Tax Benefits</p>
                      </div>
                      <p className="text-sm font-black tracking-widest text-indigo-300/50 dark:text-indigo-800 tabular-nums select-none">
                        ••••••
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusPill status={latestSlip.status} />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Finalized on {latestSlip.period}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Historical Section ───────────────────────────── */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <History className="h-4 w-4 text-gray-500" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Payment History</h3>
              </div>
              
              <div className="w-32">
                <SelectField
                  compact
                  value={yearFilter}
                  onChange={setYearFilter}
                  options={yearOptions}
                  className="!space-y-0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSlips.map((slip) => (
                <div
                  key={slip.recordId}
                  onClick={() => setSelectedRecordId(slip.recordId)}
                  className="group relative rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 transition-all hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-xl hover:shadow-indigo-500/5 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30 group-hover:text-indigo-500 transition-colors">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 dark:text-white truncate">
                        {slip.period}
                      </p>
                      <p className="text-[11px] font-black tracking-widest text-gray-300 dark:text-gray-700 tabular-nums select-none">
                        ••••••
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(slip.recordId); }}
                        className="h-10 w-10 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <div className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-indigo-500 transition-colors">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredSlips.length === 0 && (
              <div className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-10 text-center">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No slips for {yearFilter}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Payslip Detail Modal ── */}
      {selectedRecordId && selectedPayslip && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setSelectedRecordId(null)}
          />

          {/* Sheet */}
          <div className="relative w-full max-w-3xl max-h-[92dvh] overflow-y-auto overflow-x-hidden rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl border border-gray-100 dark:border-gray-800 dark:bg-gray-900 [-webkit-overflow-scrolling:touch]">

            {/* Modal control bar */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-100 bg-white/90 px-4 py-4 sm:px-6 sm:py-5 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90 print:hidden">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">
                    Payslip {selectedPayslip.period}
                  </p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Record ID: {selectedPayslip.recordId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownload(selectedRecordId)}
                  disabled={isDownloading && downloadingId === selectedRecordId}
                  className="flex h-11 px-3 sm:px-4 items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-white font-black text-xs transition-all hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                >
                  {isDownloading && downloadingId === selectedRecordId
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><Download className="h-4 w-4" /> <span className="hidden sm:inline">Download</span></>}
                </button>
                <button
                  onClick={() => window.print()}
                  className="hidden sm:flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 shadow-sm"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedRecordId(null)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 transition-all hover:text-rose-500 dark:border-gray-700 dark:bg-gray-800 shadow-sm"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Document body */}
            <div className="p-5 sm:p-8 md:p-12 print:p-0 print:m-0 print:w-full">
              <style>{`
                @media print {
                  @page { size: auto; margin: 20mm; }
                  body * { visibility: hidden; }
                  .print-document, .print-document * { visibility: visible; }
                  .print-document { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
                  .print-hidden { display: none !important; }
                }
              `}</style>
              <div className="space-y-10 print-document">

                {/* Brand & Period */}
                <div className="flex flex-wrap items-start justify-between gap-6 border-b border-gray-100 pb-10 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-indigo-600 text-white shadow-xl shadow-indigo-500/20">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">
                        CoreSync HRMS
                      </h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-1">
                        Electronic Payroll Statement
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-gray-900 dark:text-white">{selectedPayslip.period}</p>
                    <p className="mt-1 font-black text-[10px] text-gray-400 uppercase tracking-widest">Reference #{selectedPayslip.recordId}</p>
                  </div>
                </div>

                {/* Employee Info */}
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                      Employee Information
                    </h4>
                    <div className="space-y-2">
                      <p className="text-2xl font-black tracking-tight text-gray-900 dark:text-white leading-none">
                        {selectedPayslip.fullName}
                      </p>
                      <p className="text-sm font-bold text-gray-500">{selectedPayslip.designation}</p>
                      <p className="text-xs font-medium text-gray-400">{selectedPayslip.departmentName}</p>
                      <div className="mt-3 inline-block px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 font-mono text-[10px] font-black text-gray-600 dark:text-gray-400">
                        EMP-ID: {selectedPayslip.employeeCode}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                      Attendance Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-emerald-50/50 px-5 py-4 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-800/30">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 mb-1">
                          Present
                        </p>
                        <p className="text-2xl font-black tabular-nums text-emerald-600">
                          {selectedPayslip.presentDays} <span className="text-xs font-bold opacity-60">Days</span>
                        </p>
                      </div>
                      <div className="rounded-2xl bg-rose-50/50 px-5 py-4 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-800/30">
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-500/70 mb-1">
                          LWP / Absent
                        </p>
                        <p className="text-2xl font-black tabular-nums text-rose-500">
                          {selectedPayslip.absentDays} <span className="text-xs font-bold opacity-60">Days</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="overflow-hidden rounded-3xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                  <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 dark:divide-gray-800">
                    {/* Earnings */}
                    <div className="p-8">
                      <h4 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                        Earnings Breakdown
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-bold text-gray-500 dark:text-gray-400">Basic & Allowances</span>
                          <span className="font-black tabular-nums text-gray-900 dark:text-white">
                            ₹{formatINR(selectedPayslip.grossPay)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-400">Performance Bonus</span>
                          <span className="font-bold tabular-nums text-gray-900 dark:text-white">₹0</span>
                        </div>
                        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
                          <span className="text-base font-black text-emerald-600">Gross Earnings</span>
                          <span className="text-lg font-black tabular-nums text-emerald-600">
                            ₹{formatINR(selectedPayslip.grossPay)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div className="p-8">
                      <h4 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-rose-600">
                        Deductions (Statutory)
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-bold text-gray-500 dark:text-gray-400">Provident Fund (PF)</span>
                          <span className="font-black tabular-nums text-rose-500">
                            - ₹{formatINR(selectedPayslip.deductionPf)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-400">Income Tax / TDS</span>
                          <span className="font-black tabular-nums text-rose-500">
                            - ₹{formatINR(selectedPayslip.deductionTds)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-400">ESI / Health Insurance</span>
                          <span className="font-black tabular-nums text-rose-400">
                            - ₹{formatINR(selectedPayslip.deductionEsi)}
                          </span>
                        </div>
                        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
                          <span className="text-base font-black text-rose-600">Total Deductions</span>
                          <span className="text-lg font-black tabular-nums text-rose-600">
                            ₹{formatINR(selectedPayslip.totalDeductions)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Pay Banner */}
                <div className="overflow-hidden rounded-[32px] bg-gray-900 dark:bg-white p-6 sm:p-8 md:p-10 shadow-2xl">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-indigo-500">
                        Net Payable Amount
                      </h3>
                      <p className="mt-1 text-sm font-bold text-gray-500 dark:text-indigo-900/60">
                        Credited to registered bank account
                      </p>
                    </div>
                    <div className="flex flex-col items-start sm:items-end">
                      <p className="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter text-white dark:text-gray-900">
                        ₹{formatINR(selectedPayslip.netPay)}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                         <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                         Payment Processed
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 pt-8 pb-4 dark:border-gray-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-medium leading-relaxed text-gray-400 dark:text-gray-500">
                      This is a digitally signed computer-generated document and does not require a physical signature. Any discrepancies
                      in attendance or pay components should be reported to the HR department within 48 hours of
                      this statement being generated. CoreSync HRMS © 2024.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}