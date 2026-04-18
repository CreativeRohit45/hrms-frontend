// src/pages/payroll/MyPayslips.tsx
import { useState } from "react";
import {
  FileText, Eye, Calendar,
  ShieldCheck, Printer, X, Download, Loader2,
  Lock, TrendingDown, TrendingUp, Wallet,
  ChevronRight, Sparkles
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
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest
        ${isReady
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/50"
          : "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/50"
        }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isReady ? "bg-emerald-500" : "bg-amber-500"}`} />
      {isReady ? "Processed" : status}
    </span>
  );
}

// ── Skeleton Card ─────────────────────────────────────────────────
function SkeletonSlipCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="h-2 bg-gray-200 dark:bg-gray-700" />
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-6 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-16 rounded-full bg-gray-100 dark:bg-gray-800" />
          <div className="h-9 w-36 rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex gap-3">
          <div className="h-5 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
          <div className="h-5 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-12 w-full rounded-2xl bg-gray-100 dark:bg-gray-800" />
      </div>
    </div>
  );
}

// ── Payslip Card ──────────────────────────────────────────────────
function PayslipCard({
  slip,
  onView,
  onDownload,
  isDownloading,
  isViewLoading,
}: {
  slip: PayslipResponse;
  onView: (id: number) => void;
  onDownload: (id: number) => void;
  isDownloading: boolean;
  isViewLoading: boolean;
}) {
  // Map period string to month/year display
  const periodLabel = slip.period ?? "—";

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-xl hover:shadow-indigo-100/60 hover:border-indigo-100/80 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-indigo-900/60 dark:hover:shadow-indigo-950/40">
      {/* Top color bar — gradient accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400" />

      <div className="flex flex-col gap-5 p-6">
        {/* ── Row 1: Period + Status ── */}
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-black tracking-tight text-gray-900 dark:text-white">
                {periodLabel}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Monthly Statement
              </p>
            </div>
          </div>
          <StatusPill status={slip.status} />
        </div>

        {/* ── Row 2: Net Pay (Hero) ── */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-gray-50 px-5 py-4 dark:from-gray-800/60 dark:to-gray-800/30">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
            Net Payout
          </p>
          <p className="mt-1 text-4xl font-black tabular-nums tracking-tight text-gray-900 dark:text-white">
            ₹{formatINR(slip.netPay)}
          </p>

          {/* Sub-totals */}
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="tabular-nums">₹{formatINR(slip.grossPay)}</span>
              <span className="text-gray-300 dark:text-gray-600">Gross</span>
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              <TrendingDown className="h-3 w-3 text-rose-400" />
              <span className="tabular-nums">₹{formatINR(slip.totalDeductions)}</span>
              <span className="text-gray-300 dark:text-gray-600">Deductions</span>
            </span>
          </div>
        </div>

        {/* ── Row 3: Actions ── */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => onView(slip.recordId)}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-600 transition-all duration-150 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 active:scale-[0.98] dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:border-indigo-900 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300"
          >
            {isViewLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening…
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                View
                <ChevronRight className="h-3.5 w-3.5 opacity-50" />
              </>
            )}
          </button>

          <button
            onClick={() => onDownload(slip.recordId)}
            disabled={isDownloading}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black text-white shadow-md shadow-indigo-200/50 transition-all duration-150 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-300/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-indigo-900/40"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────
function EmptyVault() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 py-24 text-center dark:border-gray-800 dark:bg-gray-900/30">
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 shadow-xl shadow-indigo-200/60 dark:shadow-indigo-900/40">
          <Wallet className="h-10 w-10 text-white" strokeWidth={1.5} />
        </div>
        <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-amber-900" />
        </div>
      </div>
      <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
        Your vault is empty
      </h2>
      <p className="mt-2 max-w-xs text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
        Your payslips will appear here after the first payroll cycle is processed by your HR team.
      </p>
      <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-400">
        <Lock className="h-3 w-3" />
        Secured & Encrypted
      </div>
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

  return (
    <div className="mx-auto w-full max-w-6xl overflow-hidden space-y-8 px-4 sm:px-6 md:px-8">

      {/* ═══════════════════════════════════════════════════════════
          MISSION 1 — VAULT HEADER
      ═══════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 shadow-2xl shadow-slate-900/40 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Lock className="h-7 w-7 text-white" strokeWidth={2} />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-indigo-950">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-300/70">
                Employee Portal
              </p>
              <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                Payslip Vault
              </h1>
              <p className="mt-0.5 text-sm text-slate-400">
                Your earnings, secured and always accessible.
              </p>
            </div>
          </div>

          {/* Shield badge */}
          <div className="hidden shrink-0 flex-col items-center rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10 sm:flex">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span className="mt-1 text-[9px] font-black uppercase tracking-widest text-emerald-400/70">
              Verified
            </span>
          </div>
        </div>

        {/* Summary strip */}
        {Array.isArray(payslips) && payslips.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-4 border-t border-white/10 pt-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Total Payslips
              </p>
              <p className="mt-0.5 text-2xl font-black tabular-nums text-white">
                {payslips.length}
              </p>
            </div>
            <div className="border-l border-white/10 pl-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Latest Period
              </p>
              <p className="mt-0.5 text-sm font-black text-indigo-300">
                {(payslips as PayslipResponse[])[0]?.period ?? "—"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MISSION 2 — PAYSLIP CARDS GRID
      ═══════════════════════════════════════════════════════════ */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <SkeletonSlipCard key={i} />)}
        </div>
      ) : !Array.isArray(payslips) || payslips.length === 0 ? (
        <EmptyVault />
      ) : (
        <>
          {/* Section label */}
          <div className="flex items-center gap-3 px-1">
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400">
              {(payslips as PayslipResponse[]).length} {(payslips as PayslipResponse[]).length === 1 ? "Record" : "Records"}
            </p>
            <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(payslips as PayslipResponse[]).map((slip) => (
              <PayslipCard
                key={slip.recordId}
                slip={slip}
                onView={(id) => setSelectedRecordId(id)}
                onDownload={handleDownload}
                isDownloading={isDownloading && downloadingId === slip.recordId}
                isViewLoading={detailLoading && selectedRecordId === slip.recordId}
              />
            ))}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          PREMIUM PAYSLIP MODAL — logic untouched
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