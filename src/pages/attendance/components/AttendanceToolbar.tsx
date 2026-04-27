// ═══════════════════════════════════════════════════════════════════
//  AttendanceToolbar — Filters, view toggles, and export for
//  calendar/list views. Pure presentation, no business logic.
// ═══════════════════════════════════════════════════════════════════
import { Download } from "lucide-react";
import { exportToCSV } from "./shared";
import type { AttendanceLogResponse } from "../../../types/attendance";
import { SelectField } from "../../../components/ui/SelectField";

interface AttendanceToolbarProps {
  viewMode: "calendar" | "list" | "roster";
  setViewMode: (mode: "calendar" | "list" | "roster") => void;
  filterMonth: string;
  setFilterMonth: (v: string) => void;
  monthOptions: { value: string; label: string }[];
  filtered: AttendanceLogResponse[];
  activeEmployeeCode: string;
  isLoading: boolean;
  isManager: boolean;
}

export function AttendanceToolbar({
  viewMode, setViewMode,
  filterMonth, setFilterMonth,
  monthOptions, filtered,
  activeEmployeeCode, isLoading, isManager,
}: AttendanceToolbarProps) {
  const modes = isManager
    ? (["calendar", "list", "roster"] as const)
    : (["calendar", "list"] as const);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-6 py-4 sm:py-5
      border-b border-gray-200 dark:border-gray-800">
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-gray-900 dark:text-white text-lg font-black tracking-tight leading-none">
            Attendance
          </h2>
          {!isLoading && (
            <p className="text-[10px] font-bold text-indigo-500/80 uppercase tracking-widest mt-1">
              {filtered.length} {filtered.length === 1 ? "Record" : "Records"}
            </p>
          )}
        </div>

        <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Sub-view toggle (Calendar/List/Roster) */}
          <div className="hidden sm:flex bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl border border-gray-200 dark:border-gray-700/50">
            {modes.map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all
                  ${viewMode === mode
                    ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            {/* Month filter */}
            <div className="flex-1 sm:min-w-[160px]">
              <SelectField
                compact
                value={filterMonth}
                onChange={(v) => setFilterMonth(v)}
                options={monthOptions.map(opt => ({ label: opt.label, value: opt.value }))}
                className="!space-y-0"
              />
            </div>

            {/* CSV Export button */}
            {filtered.length > 0 && (
              <button
                onClick={() => {
                  exportToCSV(filtered, `attendance_${activeEmployeeCode}_${filterMonth}.csv`);
                }}
                className="flex items-center justify-center h-10 px-4
                  bg-indigo-600 text-white rounded-xl text-xs font-bold
                  hover:bg-indigo-700 active:scale-95
                  transition-all shadow-lg shadow-indigo-500/20 dark:shadow-none"
                title="Export current view to CSV"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Export</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
