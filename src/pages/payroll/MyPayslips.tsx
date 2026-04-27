import { useState } from "react";
import { Calendar, Download, FileText, Loader2, ReceiptText, X } from "lucide-react";
import type { PayslipResponse } from "../../types/payroll";
import { useDownloadPayslip, useMyPayslips, usePayslipDetail } from "../../hooks/queries/usePayroll";
import { SelectField } from "../../components/ui/SelectField";
import { StatusBadge } from "../../components/ui/StatusBadge";

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function statusTone(status: string) {
  if (status === "PAID" || status === "LOCKED" || status === "APPROVED") return "success";
  if (status === "DRAFT") return "warning";
  return "info";
}

function PayslipRow({
  slip,
  onOpen,
  onDownload,
  isDownloading,
}: {
  slip: PayslipResponse;
  onOpen: () => void;
  onDownload: () => void;
  isDownloading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
          <ReceiptText className="h-5 w-5" />
        </div>
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-black text-gray-900 dark:text-white">{slip.period}</p>
          <p className="mt-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
            Net pay {formatINR(slip.netPay)}
          </p>
          <div className="mt-2">
            <StatusBadge label={slip.status} tone={statusTone(slip.status) as any} />
          </div>
        </button>
        <button
          type="button"
          onClick={onDownload}
          disabled={isDownloading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-100 text-gray-500 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function MyPayslips() {
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { data: payslips, isLoading } = useMyPayslips();
  const { data: selectedPayslip } = usePayslipDetail(selectedRecordId);
  const { mutate: downloadPdf, isPending: isDownloading } = useDownloadPayslip();

  const slips = (Array.isArray(payslips) ? payslips : []) as PayslipResponse[];
  const latestSlip = slips[0] || null;
  const availableYears = Array.from(new Set(slips.map((s) => s.period?.split(" ").pop()).filter(Boolean))) as string[];
  const yearOptions = (availableYears.length ? availableYears : [yearFilter]).map((year) => ({ label: year, value: year }));
  const filteredSlips = slips.filter((s) => !yearFilter || s.period?.includes(yearFilter));

  const handleDownload = (recordId: number) => {
    setDownloadingId(recordId);
    downloadPdf(recordId, { onSettled: () => setDownloadingId(null) });
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 overflow-x-hidden px-3 pb-24 pt-3 sm:px-6 md:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">My Payslips</h1>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">View and download processed salary statements.</p>
        </div>
        <div className="w-full sm:w-40">
          <SelectField compact value={yearFilter} onChange={setYearFilter} options={yearOptions} className="!space-y-0" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : !latestSlip ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center dark:border-gray-800 dark:bg-gray-900">
          <FileText className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mt-4 text-sm font-black text-gray-700 dark:text-gray-200">No payslips yet</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Your payslips will appear after payroll is processed.</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-500">
                  <Calendar className="h-4 w-4" />
                  Latest Payslip
                </div>
                <h2 className="mt-2 truncate text-xl font-black text-gray-900 dark:text-white">{latestSlip.period}</h2>
                <p className="mt-1 text-sm font-semibold text-gray-500 dark:text-gray-400">
                  Net pay {formatINR(latestSlip.netPay)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecordId(latestSlip.recordId)}
                  className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-gray-900 px-4 text-sm font-black text-white dark:bg-white dark:text-gray-900 sm:flex-none"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(latestSlip.recordId)}
                  disabled={isDownloading && downloadingId === latestSlip.recordId}
                  className="flex min-h-[44px] items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-black text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200"
                >
                  {isDownloading && downloadingId === latestSlip.recordId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Payment History</h3>
            {filteredSlips.map((slip) => (
              <PayslipRow
                key={slip.recordId}
                slip={slip}
                onOpen={() => setSelectedRecordId(slip.recordId)}
                onDownload={() => handleDownload(slip.recordId)}
                isDownloading={isDownloading && downloadingId === slip.recordId}
              />
            ))}
          </div>
        </>
      )}

      {selectedRecordId && selectedPayslip && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRecordId(null)} />
          <div className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-gray-900 dark:text-white">Payslip {selectedPayslip.period}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Record #{selectedPayslip.recordId}</p>
              </div>
              <button onClick={() => setSelectedRecordId(null)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Employee</p>
                <p className="mt-1 text-lg font-black text-gray-900 dark:text-white">{selectedPayslip.fullName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedPayslip.designation} · {selectedPayslip.departmentName}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Gross Pay</p>
                  <p className="mt-1 text-lg font-black text-emerald-700 dark:text-emerald-300">{formatINR(selectedPayslip.grossPay)}</p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-950/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Deductions</p>
                  <p className="mt-1 text-lg font-black text-rose-700 dark:text-rose-300">{formatINR(selectedPayslip.totalDeductions)}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-gray-900 p-5 text-white dark:bg-white dark:text-gray-900">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Net Pay</p>
                <p className="mt-1 text-3xl font-black">{formatINR(selectedPayslip.netPay)}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                  <p className="text-[10px] font-bold text-gray-400">Present</p>
                  <p className="text-sm font-black">{selectedPayslip.presentDays}</p>
                </div>
                <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                  <p className="text-[10px] font-bold text-gray-400">Leave</p>
                  <p className="text-sm font-black">{selectedPayslip.leaveDays}</p>
                </div>
                <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                  <p className="text-[10px] font-bold text-gray-400">Absent</p>
                  <p className="text-sm font-black">{selectedPayslip.absentDays}</p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] dark:border-gray-800 dark:bg-gray-900">
              <button
                onClick={() => handleDownload(selectedRecordId)}
                disabled={isDownloading && downloadingId === selectedRecordId}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-sm font-black text-white disabled:opacity-50"
              >
                {isDownloading && downloadingId === selectedRecordId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download Payslip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
