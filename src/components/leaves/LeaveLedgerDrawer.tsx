import { useMemo, useState } from "react";
import { Copy, FileText, History, Loader2, Palmtree, ShieldCheck } from "lucide-react";
import { AppModal } from "../ui/AppModal";
import { BalanceAdjustmentModal } from "./BalanceAdjustmentModal";
import { useEmployeeAuditTrail, useEmployeeBalances, useEmployeeLeaveRequests } from "../../hooks/queries/useLeaves";

function formatSignedDays(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}d`;
}

function formatCompactDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function buildSummary(employeeName: string, balances: any[], audits: any[]) {
  const lines = balances.map((balance) => `${balance.leaveTypeCode}: ${balance.balance.toFixed(1)} of ${balance.allocated.toFixed(1)} days remaining`);
  const latestAudit = audits[0]
    ? `Latest ledger update: ${audits[0].transactionType} ${formatSignedDays(audits[0].amount)} on ${formatCompactDate(audits[0].createdAt)}`
    : "No ledger entries yet.";

  return [`Leave statement for ${employeeName}`, ...lines, latestAudit].join("\n");
}

export function LeaveLedgerDrawer({
  employeeId,
  employeeName,
  isOpen,
  onClose,
}: {
  employeeId: number;
  employeeName: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const { data: balances = [], isLoading: loadingBalances } = useEmployeeBalances(employeeId, isOpen);
  const {
    data: auditsData,
    isLoading: loadingAudits,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEmployeeAuditTrail(employeeId, isOpen);
  const { data: leaveRequests = [], isLoading: loadingRequests } = useEmployeeLeaveRequests(employeeId, isOpen);

  const audits = useMemo(() => auditsData?.pages.flatMap((page) => page.content) || [], [auditsData]);
  const summaryText = useMemo(() => buildSummary(employeeName, balances, audits), [audits, balances, employeeName]);
  const isLoading = loadingBalances || loadingAudits || loadingRequests;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summaryText);
  };

  return (
    <>
      <AppModal
        isOpen={isOpen}
        onClose={onClose}
        title={`${employeeName} · Leave Ledger`}
        description="Balances, audit history, and recent leave requests in one responsive admin workspace."
        size="xl"
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCopy}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 sm:w-auto"
            >
              <Copy className="h-4 w-4" />
              Copy Summary
            </button>
            <button
              type="button"
              onClick={() => setShowAdjustModal(true)}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-sm font-black text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 sm:w-auto"
            >
              <ShieldCheck className="h-4 w-4" />
              Manage Balances
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="rounded-3xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Copy-ready Summary</p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-indigo-900 dark:text-indigo-100 whitespace-pre-line">
                  {summaryText}
                </p>
              </div>
              <FileText className="h-5 w-5 shrink-0 text-indigo-400" />
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Palmtree className="h-4 w-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Current Balances</h3>
            </div>
            {isLoading ? (
              <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-5 text-sm font-bold text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading leave ledger...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {balances.map((balance) => (
                  <div key={balance.leaveTypeCode} className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{balance.leaveTypeCode}</p>
                        <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{balance.leaveTypeName}</p>
                      </div>
                      <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{balance.balance.toFixed(1)}d</p>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Used {balance.used.toFixed(1)} of {balance.allocated.toFixed(1)} days
                    </p>
                  </div>
                ))}
                {!balances.length && (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm font-semibold text-gray-400 dark:border-gray-800 dark:bg-gray-900/40">
                    No leave balances allocated yet.
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Audit Trail</h3>
            </div>
            <div className="space-y-3">
              {audits.map((audit) => (
                <div key={audit.id} className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase text-gray-900 dark:text-white">{audit.transactionType}</p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-indigo-500">{audit.leaveTypeCode}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${audit.amount >= 0 ? "text-emerald-600" : "text-rose-500"}`}>{formatSignedDays(audit.amount)}</p>
                      <p className="text-[10px] font-bold text-gray-400">Balance {audit.balanceAfter.toFixed(1)}d</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{audit.reason || "System adjusted"}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <span>{formatCompactDate(audit.createdAt)}</span>
                    <span>{audit.performedByName || "System"}</span>
                  </div>
                </div>
              ))}
              {!isLoading && !audits.length && (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm font-semibold text-gray-400 dark:border-gray-800 dark:bg-gray-900/40">
                  No audit entries yet.
                </div>
              )}
              {hasNextPage && (
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  {isFetchingNextPage ? "Loading more audits..." : "Load More Audits"}
                </button>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Recent Leave Requests</h3>
            </div>
            <div className="space-y-3">
              {leaveRequests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-gray-900 dark:text-white">{request.leaveTypeName}</p>
                      <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {request.startDate}{request.startDate !== request.endDate ? ` to ${request.endDate}` : ""}
                      </p>
                    </div>
                    <span className="rounded-xl border border-gray-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:border-gray-700 dark:text-gray-300">
                      {request.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-widest text-indigo-500">
                    <span>{request.appliedDays.toFixed(1)} days</span>
                    <span>Applied {formatCompactDate(request.createdAt)}</span>
                  </div>
                </div>
              ))}
              {!isLoading && !leaveRequests.length && (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm font-semibold text-gray-400 dark:border-gray-800 dark:bg-gray-900/40">
                  No leave requests recorded yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </AppModal>
      {showAdjustModal && (
        <BalanceAdjustmentModal
          employeeId={employeeId}
          balances={balances}
          onClose={() => setShowAdjustModal(false)}
          onSuccess={() => setShowAdjustModal(false)}
        />
      )}
    </>
  );
}
