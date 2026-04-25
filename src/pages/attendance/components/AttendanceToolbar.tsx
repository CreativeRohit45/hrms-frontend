// ═══════════════════════════════════════════════════════════════════
//  AttendanceToolbar — Filters, view toggles, and export for
//  calendar/list views. Pure presentation, no business logic.
// ═══════════════════════════════════════════════════════════════════
import { exportToCSV } from "./shared";
import type { AttendanceLogResponse } from "../../../types/attendance";

interface AttendanceToolbarProps {
  viewMode: "calendar" | "list" | "roster";
  setViewMode: (mode: "calendar" | "list" | "roster") => void;
  filterMonth: string;
  setFilterMonth: (v: string) => void;
  monthOptions: { value: string; label: string }[];
  filtered: AttendanceLogResponse[];
  activeEmployeeCode: string;
  isLoading: boolean;
}

export function AttendanceToolbar({
  viewMode, setViewMode,
  filterMonth, setFilterMonth,
  monthOptions, filtered,
  activeEmployeeCode, isLoading,
}: AttendanceToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-6 py-4 sm:py-5
      border-b border-gray-200 dark:border-gray-800">
      <p className="text-gray-700 dark:text-gray-300 text-sm font-semibold">
        Attendance Records
        {!isLoading && (
          <span className="ml-2 text-gray-400 dark:text-gray-600 text-xs font-normal">
            ({filtered.length} {filtered.length === 1 ? "entry" : "entries"})
          </span>
        )}
      </p>
      <div className="w-full sm:w-auto mt-3 sm:mt-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Desktop Sub-view toggle (Calendar/List) */}
        <div className="hidden sm:flex sm:order-3 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700 mr-1">
          {(["calendar", "list"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all capitalize
                ${viewMode === mode
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:contents gap-2 w-full sm:w-auto">
          {/* Status filter removed as requested */}

          {/* Month filter */}
          <div className="relative w-full sm:w-auto sm:order-4">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="appearance-none w-full bg-gray-50 dark:bg-gray-800
                border border-gray-200 dark:border-gray-700 rounded-xl
                text-gray-700 dark:text-gray-300 text-[11px] sm:text-xs font-bold
                pl-2.5 sm:pl-3 pr-8 sm:pr-10 py-1.5 sm:py-2 outline-none focus:ring-4
                focus:ring-indigo-500/10 focus:border-indigo-400
                transition-all cursor-pointer min-w-0 sm:min-w-[150px]"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" fill="none"
                stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* CSV Export button */}
          {filtered.length > 0 && (
            <button
              onClick={() => {
                exportToCSV(filtered, `attendance_${activeEmployeeCode}_${filterMonth}.csv`);
              }}
              className="col-span-2 sm:order-1 sm:flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-2
                bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200
                dark:border-gray-700 rounded-xl text-[11px] sm:text-xs font-bold
                text-gray-600 dark:text-gray-400
                hover:bg-emerald-50 dark:hover:bg-emerald-950/30
                hover:text-emerald-700 dark:hover:text-emerald-400
                hover:border-emerald-300 dark:hover:border-emerald-800
                transition-all shadow-sm w-full sm:w-auto"
              title="Export current view to CSV"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor"
                viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
