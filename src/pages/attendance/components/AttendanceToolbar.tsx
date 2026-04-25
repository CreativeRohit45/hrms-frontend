// ═══════════════════════════════════════════════════════════════════
//  AttendanceToolbar — Filters, view toggles, and export for
//  calendar/list views. Pure presentation, no business logic.
// ═══════════════════════════════════════════════════════════════════
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
}

export function AttendanceToolbar({
  viewMode, setViewMode,
  filterMonth, setFilterMonth,
  monthOptions, filtered,
  activeEmployeeCode, isLoading,
}: AttendanceToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-5
      border-b border-gray-200 dark:border-gray-800">
      <p className="text-gray-700 dark:text-gray-300 text-sm font-semibold">
        Attendance Records
        {!isLoading && (
          <span className="ml-2 text-gray-400 dark:text-gray-600 text-xs font-normal">
            ({filtered.length} {filtered.length === 1 ? "entry" : "entries"})
          </span>
        )}
      </p>
      <div className="w-full sm:w-auto flex items-center gap-2">
        {/* Desktop Sub-view toggle (Calendar/List) */}
        <div className="hidden sm:flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
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

        {/* Month filter — compact on all screens */}
        <div className="flex-1 sm:flex-none sm:min-w-[150px]">
          <SelectField
            compact
            value={filterMonth}
            onChange={(v) => setFilterMonth(v)}
            options={monthOptions.map(opt => ({ label: opt.label, value: opt.value }))}
          />
        </div>

        {/* CSV Export button — compact, icon-only on mobile */}
        {filtered.length > 0 && (
          <button
            onClick={() => {
              exportToCSV(filtered, `attendance_${activeEmployeeCode}_${filterMonth}.csv`);
            }}
            className="flex-shrink-0 flex items-center justify-center gap-1.5 h-10 px-3 sm:px-4
              bg-white dark:bg-gray-800 border border-gray-200
              dark:border-gray-700 rounded-xl text-xs font-bold
              text-gray-600 dark:text-gray-400
              hover:bg-emerald-50 dark:hover:bg-emerald-950/30
              hover:text-emerald-700 dark:hover:text-emerald-400
              hover:border-emerald-300 dark:hover:border-emerald-800
              transition-all shadow-sm"
            title="Export current view to CSV"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor"
              viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Export</span>
          </button>
        )}
      </div>
    </div>
  );
}
