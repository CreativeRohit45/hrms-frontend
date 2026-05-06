import { AppModal } from "../ui/AppModal";
import { 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar,
  User,
  Info,
  Banknote
} from "lucide-react";



interface BalanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  audits: any[];
  isLoading?: boolean;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

export function BalanceHistoryModal({
  isOpen,
  onClose,
  audits,
  isLoading,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
}: BalanceHistoryModalProps) {
  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Balance History"
      size="lg"
    >
      <div className="space-y-6">
        <div className="rounded-3xl bg-indigo-600 p-6 text-white shadow-xl shadow-indigo-500/20">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Banknote className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Audit Trail</h3>
              <p className="text-xs font-medium text-indigo-100/70">
                Chronological record of all balance adjustments
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-50 dark:bg-gray-800/50" />
              ))}
            </div>
          ) : audits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-10 w-10 text-gray-200 dark:text-gray-700" />
              <p className="mt-4 text-sm font-bold text-gray-400">No transactions found</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {audits.map((audit) => {
                const isCredit = audit.transactionType === "ACCRUAL" || audit.transactionType === "REFUND" || audit.transactionType === "MANUAL_ADD";
                
                return (
                  <div 
                    key={audit.id}
                    className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-indigo-100 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isCredit 
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30" 
                            : "bg-rose-50 text-rose-600 dark:bg-rose-950/30"
                        }`}>
                          {isCredit ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-black text-gray-900 dark:text-white">
                              {audit.leaveTypeName}
                            </p>
                            <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600">/</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              {audit.transactionType.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] font-medium text-gray-500 dark:text-gray-400">
                            {audit.reason}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-black ${isCredit ? "text-emerald-600" : "text-rose-600"}`}>
                          {isCredit ? "+" : ""}{audit.amount}d
                        </p>
                        <p className="text-[10px] font-bold text-gray-400">
                          Bal: {audit.balanceAfter}d
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3 dark:border-gray-800/50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-gray-300" />
                          <span className="text-[10px] font-bold text-gray-400">
                            {new Date(audit.createdAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-gray-300" />
                          <span className="text-[10px] font-bold text-gray-400">
                            By {audit.performedByName || "System"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {hasNextPage && (
            <div className="pt-4 text-center">
              <button
                onClick={() => fetchNextPage && fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
        
        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-950">
           <div className="flex gap-3">
              <Info className="h-4 w-4 shrink-0 text-indigo-400" />
              <p className="text-[10px] leading-relaxed font-medium text-gray-500 dark:text-gray-400">
                This is a system-generated audit log. "Accrual" represents monthly grants, "Escrow Deduct" represents days locked for pending requests, and "Refund" occurs when a request is rejected or cancelled.
              </p>
           </div>
        </div>
      </div>
    </AppModal>
  );
}
