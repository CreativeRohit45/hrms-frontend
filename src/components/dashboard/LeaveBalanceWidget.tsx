import { Palmtree, Info } from "lucide-react";
import { useMyBalances } from "../../hooks/queries/useLeaves";

export function LeaveBalanceWidget() {
  const { data: balances = [], isLoading } = useMyBalances();

  if (isLoading) {
    return (
      <div className="grid h-64 grid-cols-2 gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800/60 dark:bg-gray-900">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse space-y-2">
            <div className="h-3 w-12 rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-8 w-full rounded-xl bg-gray-50 dark:bg-gray-800/50" />
          </div>
        ))}
      </div>
    );
  }

  if (!balances || balances.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center dark:border-gray-800 dark:bg-gray-900/50">
        <Palmtree className="mb-2 h-8 w-8 text-gray-300" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No Leave Data</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            <Palmtree className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Leave Balances
          </h2>
        </div>
        <div className="group relative cursor-help">
          <Info className="h-3.5 w-3.5 text-gray-300 transition-colors group-hover:text-indigo-400" />
          <div className="absolute right-0 top-6 hidden w-48 rounded-xl border border-gray-100 bg-white p-3 text-[10px] font-medium text-gray-500 shadow-xl dark:border-gray-800 dark:bg-gray-900 group-hover:block z-50">
            Balances are updated automatically based on accrual and approved requests.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {balances.map((b: any) => {
          const total = (b.balance || 0) + (b.used || 0);
          const percentage = total > 0 ? Math.round(((b.balance || 0) / total) * 100) : 0;
          
          return (
            <div 
              key={b.leaveTypeCode}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-500/5 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-indigo-900/50"
            >
              <div className="relative flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-indigo-500 transition-colors">
                    {b.leaveTypeName}
                  </span>
                  <span className="text-lg font-black text-gray-900 dark:text-white">
                    {b.balance}
                    <span className="ml-0.5 text-[10px] text-gray-400">d</span>
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                    <span>Used: {b.used}d</span>
                    <span>Total: {total}d</span>
                  </div>
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div 
                      className="absolute left-0 top-0 h-full rounded-full bg-indigo-500 transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

