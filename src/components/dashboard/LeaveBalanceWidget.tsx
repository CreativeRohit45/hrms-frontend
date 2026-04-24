import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from "recharts";
import { Loader2, Palmtree } from "lucide-react";
import { useMyBalances } from "../../hooks/queries/useLeaves";

export function LeaveBalanceWidget() {
  const { data: balances, isLoading } = useMyBalances();

  // Pick the Annual Leave balance (or the first available)
  const mainBalance = balances?.find((b: any) => b.leaveTypeCode === "AL") || balances?.[0];

  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-800/60 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const used = mainBalance?.used || 0;
  const available = mainBalance?.balance || 0;

  const data = [
    { name: "Used", value: used, color: "#818cf8" }, // Indigo 400
    { name: "Available", value: available, color: "#e0e7ff" }, // Indigo 100
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-800/60 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!mainBalance) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm dark:border-gray-800/60 dark:bg-gray-900 group">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <Palmtree className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
              {mainBalance.leaveTypeName}
            </h2>
          </div>
        </div>
      </div>

      <div className="relative h-48 w-full transition-transform duration-300 group-hover:scale-105">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
              cornerRadius={10}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <Label
                value={`${available}`}
                position="centerBottom"
                dy={-5}
                className="text-3xl font-black fill-gray-900 dark:fill-white"
              />
              <Label
                value="Days Left"
                position="centerTop"
                dy={15}
                className="text-[10px] font-black uppercase tracking-widest fill-gray-400"
              />
            </Pie>
            <Tooltip
              cursor={{ fill: "transparent" }}
              contentStyle={{
                borderRadius: "1rem",
                border: "none",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(8px)",
                padding: "8px 12px",
              }}
              itemStyle={{ fontWeight: "bold", color: "#111827" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-indigo-100" />
          <span className="text-xs font-bold text-gray-500">Available ({available})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-indigo-400" />
          <span className="text-xs font-bold text-gray-500">Used ({used})</span>
        </div>
      </div>
    </div>
  );
}
