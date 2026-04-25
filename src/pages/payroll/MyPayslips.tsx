// src/pages/payroll/MyPayslips.tsx
import { useState } from "react";
import {
  FileText, Eye, Calendar, IndianRupee,
  Printer, X, Download, Loader2,
  TrendingDown, TrendingUp,
  ChevronRight, ShieldCheck,
} from "lucide-react";
import type { PayslipResponse } from "../../types/payroll";
import { useMyPayslips, usePayslipDetail, useDownloadPayslip } from "../../hooks/queries/usePayroll";

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
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest
        ${isReady
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
        }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isReady ? "bg-emerald-500" : "bg-amber-500"}`} />
      {isReady ? "Processed" : status}
    </span>
  );
}

// ── Skeleton Row ──────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="animate-pulse flex items-center gap-4 px-5 py-4 border-b border-gray-50 dark:border-gray-800/50">
      <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-28 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="h-5 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function MyPayslips() {
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

  const { data: payslips, isLoading: loading } = useMyPayslips();

  // Conditionally fetch detail only when a record is selected
  const { data: selectedPayslip, isLoading: detailLoading } = usePayslipDetail(selectedRecordId);

  const { mutate: downloadPdf, isPending: isDownloading } = useDownloadPayslip();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownload = (recordId: number) => {
    setDownloadingId(recordId);
    downloadPdf(recordId, {
      onSettled: () => setDownloadingId(null),
    });
  };

  const latestSlip = Array.isArray(payslips) && payslips.length > 0 ? (payslips as PayslipResponse[])[0] : null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 sm:px-6 md:px-8 pb-20">

      {/* ═══════════════════════════════════════════════════════════
          PAGE HEADER — Clean & minimal
      ═══════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            My Payslips
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            View and download your monthly salary statements
          </p>
        </div>
        {latestSlip && (
          <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2.5 border border-emerald-100 dark:border-emerald-800/40">
            <IndianRupee className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/70">Latest Net</p>
              <p className="text-base font-black tabular-nums text-emerald-700 dark:text-emerald-300 leading-none">
                ₹{formatINR(latestSlip.netPay)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAYSLIP LIST — Grouped by year for easy navigation
      ═══════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <div>
            {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
          </div>
        ) : !Array.isArray(payslips) || payslips.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-5">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
              No payslips yet
            </h2>
            <p className="mt-2 max-w-xs text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Your payslips will appear here after the first payroll cycle is processed by HR.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {/* Table Header — desktop only */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_100px_120px_100px] gap-4 px-5 py-3 bg-gray-50/70 dark:bg-gray-800/30">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Period</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Net Pay</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Status</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Actions</p>
            </div>

            {(payslips as PayslipResponse[]).map((slip) => (
              <div
                key={slip.recordId}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/30 cursor-pointer"
                onClick={() => setSelectedRecordId(slip.recordId)}
              >
                {/* Period icon */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <Calendar className="h-5 w-5" />
                </div>

                {/* Period + Breakdown */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {slip.period ?? "—"}
                  </p>
                  <div className="mt-0.5 flex items-center gap-3 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                      <span className="tabular-nums">₹{formatINR(slip.grossPay)}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3 text-rose-400" />
                      <span className="tabular-nums">₹{formatINR(slip.totalDeductions)}</span>
                    </span>
                  </div>

                  {/* Mobile-only: net pay + status */}
                  <div className="sm:hidden mt-2 flex items-center justify-between">
                    <p className="text-base font-black tabular-nums text-gray-900 dark:text-white">
                      ₹{formatINR(slip.netPay)}
                    </p>
                    <StatusPill status={slip.status} />
                  </div>
                </div>

                {/* Desktop: Net pay */}
                <p className="hidden sm:block text-sm font-black tabular-nums text-gray-900 dark:text-white text-right w-[100px]">
                  ₹{formatINR(slip.netPay)}
                </p>

                {/* Desktop: Status */}
                <div className="hidden sm:flex w-[120px] justify-center">
                  <StatusPill status={slip.status} />
                </div>

                {/* Desktop: Actions */}
                <div className="hidden sm:flex items-center gap-1.5 w-[100px] justify-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(slip.recordId); }}
                    disabled={isDownloading && downloadingId === slip.recordId}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:text-indigo-600 hover:border-indigo-200 active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-indigo-400 disabled:opacity-50"
                    title="Download PDF"
                  >
                    {isDownloading && downloadingId === slip.recordId
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Download className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedRecordId(slip.recordId); }}
                    disabled={detailLoading && selectedRecordId === slip.recordId}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:text-indigo-600 hover:border-indigo-200 active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-indigo-400 disabled:opacity-50"
                    title="View Payslip"
                  >
                    {detailLoading && selectedRecordId === slip.recordId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Mobile: Chevron */}
                <ChevronRight className="sm:hidden h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PAYSLIP DETAIL MODAL — Bottom sheet on mobile
      ═══════════════════════════════════════════════════════════ */}
      {selectedRecordId && selectedPayslip && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setSelectedRecordId(null)}
          />

          {/* Sheet */}
          <div className="relative w-full max-w-3xl max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-gray-100 dark:border-gray-800 dark:bg-gray-900 [-webkit-overflow-scrolling:touch]">

            {/* Modal control bar */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-100 bg-white/90 px-6 py-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/90 print:hidden">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-900 dark:text-white truncate">
                    {selectedPayslip.period}
                  </p>
                  <p className="text-[10px] font-mono text-gray-400">
                    #{selectedPayslip.recordId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownload(selectedRecordId)}
                  disabled={isDownloading && downloadingId === selectedRecordId}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
                  title="Download PDF"
                >
                  {isDownloading && downloadingId === selectedRecordId
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Download className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600 transition-colors hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 shadow-sm"
                  title="Print"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedRecordId(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 transition-colors hover:text-rose-500 dark:border-gray-700 dark:bg-gray-800 shadow-sm"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Document body */}
            <div className="p-6 md:p-10 print:p-0 print:m-0 print:w-full">
              <style>{`
                @media print {
                  @page { size: auto; margin: 20mm; }
                  body * { visibility: hidden; }
                  .print-document, .print-document * { visibility: visible; }
                  .print-document { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
                  .print-hidden { display: none !important; }
                }
              `}</style>
              <div className="space-y-8 print-document">

                {/* Brand & Period */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-8 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black uppercase tracking-tighter text-gray-900 dark:text-white">
                        CoreSync HRMS
                      </h2>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
                        Payslip — Electronically Generated
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedPayslip.period}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-gray-400">RECORD #{selectedPayslip.recordId}</p>
                  </div>
                </div>

                {/* Employee Info */}
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                      Employee Information
                    </h4>
                    <div className="space-y-1">
                      <p className="text-lg font-black leading-none text-gray-900 dark:text-white">
                        {selectedPayslip.fullName}
                      </p>
                      <p className="text-xs font-medium text-gray-500">{selectedPayslip.designation}</p>
                      <p className="text-xs text-gray-400">{selectedPayslip.departmentName}</p>
                      <p className="mt-2 font-mono text-xs font-bold text-indigo-500">
                        {selectedPayslip.employeeCode}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                      Attendance Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-emerald-50 px-4 py-3 dark:bg-emerald-950/30">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">
                          Present
                        </p>
                        <p className="mt-0.5 text-xl font-black tabular-nums text-emerald-600">
                          {selectedPayslip.presentDays}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-rose-50 px-4 py-3 dark:bg-rose-950/30">
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-500/70">
                          LWP / Absent
                        </p>
                        <p className="mt-0.5 text-xl font-black tabular-nums text-rose-500">
                          {selectedPayslip.absentDays}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                  <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 dark:divide-gray-800">
                    {/* Earnings */}
                    <div className="p-6">
                      <h4 className="mb-4 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                        Earnings
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Regular Component</span>
                          <span className="font-bold tabular-nums text-gray-900 dark:text-white">
                            ₹{formatINR(selectedPayslip.grossPay)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-xs text-gray-400">Arrears / Other</span>
                          <span className="font-bold tabular-nums text-gray-900 dark:text-white">₹0</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                          <span className="text-sm font-black text-emerald-600">Total Earnings</span>
                          <span className="font-black tabular-nums text-emerald-600">
                            ₹{formatINR(selectedPayslip.grossPay)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div className="p-6">
                      <h4 className="mb-4 text-[10px] font-black uppercase tracking-widest text-rose-600">
                        Deductions
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Provident Fund (PF)</span>
                          <span className="font-bold tabular-nums text-rose-500">
                            ₹{formatINR(selectedPayslip.deductionPf)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-xs text-gray-400">Prof. Tax / TDS</span>
                          <span className="font-bold tabular-nums text-rose-500">
                            ₹{formatINR(selectedPayslip.deductionTds)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-xs font-bold italic text-amber-500">ESI / Insurance</span>
                          <span className="font-bold tabular-nums text-rose-400">
                            ₹{formatINR(selectedPayslip.deductionEsi)}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                          <span className="text-sm font-black uppercase text-rose-600">Total Deductions</span>
                          <span className="font-black tabular-nums text-rose-600">
                            ₹{formatINR(selectedPayslip.totalDeductions)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Pay Banner */}
                <div className="overflow-hidden rounded-2xl bg-indigo-600 p-6 shadow-xl shadow-indigo-600/30 sm:p-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
                        Net Payable Amount
                      </h3>
                      <p className="mt-0.5 text-sm italic text-indigo-300/80">
                        Credited to registered bank account
                      </p>
                    </div>
                    <p className="text-4xl font-black tabular-nums tracking-tight text-white sm:text-5xl">
                      ₹{formatINR(selectedPayslip.netPay)}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 pt-6 pb-2 dark:border-gray-800">
                  <p className="text-[10px] italic leading-relaxed text-gray-400 dark:text-gray-500">
                    * This is a computer generated document and does not require a signature. Any discrepancies
                    in attendance or pay components should be reported to the HR department within 48 hours of
                    payslip receipt. All amounts are in INR.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}