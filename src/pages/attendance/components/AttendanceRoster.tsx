// ═══════════════════════════════════════════════════════════════════
//  AttendanceRoster — Daily roster table + mobile cards + date picker.
//  Pure presentation, no business logic.
// ═══════════════════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from "react";
import { getServerNow } from "../../../utils/serverTime";
import {
  formatMinutes,
  formatTime,
  formatLongDate,
  type AttendanceLogResponse,
} from "../../../types/attendance";
import { STATUS_CONFIG, LiveSessionTimer, SkeletonRow, exportToCSV, generateCalendarGrid } from "./shared";

interface AttendanceRosterProps {
  dailyLogs: AttendanceLogResponse[];
  rosterDate: string;
  setRosterDate: (d: string) => void;
  rosterSearchTerm: string;
  setRosterSearchTerm: (s: string) => void;
  isLoading: boolean;
  isManager: boolean;
  todayStr: string;
  setReviewTarget: (log: AttendanceLogResponse | null) => void;
  setOtApproveTarget: (log: AttendanceLogResponse | null) => void;
}

export function AttendanceRoster({
  dailyLogs, rosterDate, setRosterDate,
  rosterSearchTerm, setRosterSearchTerm,
  isLoading, isManager, todayStr,
  setReviewTarget, setOtApproveTarget,
}: AttendanceRosterProps) {
  const [isRosterPickerOpen, setIsRosterPickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState<string>(() => {
    const d = getServerNow();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    if (rosterDate) {
      const [y, m] = rosterDate.split("-");
      setPickerMonth(`${y}-${m}`);
    }
  }, [rosterDate]);

  const pickerDays = useMemo(() => generateCalendarGrid(pickerMonth), [pickerMonth]);

  const filteredDailyLogs = useMemo(() => {
    if (!rosterSearchTerm.trim()) return dailyLogs;
    const term = rosterSearchTerm.toLowerCase();
    return dailyLogs.filter(
      (l) => l.fullName.toLowerCase().includes(term) || l.employeeCode.toLowerCase().includes(term)
    );
  }, [dailyLogs, rosterSearchTerm]);

  return (
    <div className="p-0">
      {/* Roster toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-6 py-4 sm:py-5
        border-b border-gray-200 dark:border-gray-800
        bg-gray-50/30 dark:bg-gray-800/10">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Date picker button */}
          <div className="relative">
            <button
              onClick={() => setIsRosterPickerOpen(!isRosterPickerOpen)}
              className="flex items-center gap-2.5 pl-10 pr-4 py-2.5
                bg-white dark:bg-gray-950 border border-gray-200
                dark:border-gray-800 rounded-xl text-gray-800
                dark:text-gray-200 text-sm font-bold focus:outline-none
                focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500
                hover:border-gray-300 dark:hover:border-gray-700
                transition-all shadow-sm w-full sm:min-w-[200px]"
            >
              <div className="absolute inset-y-0 left-0 pl-3.5
                flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none"
                  stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              {formatLongDate(rosterDate)}
            </button>

            {isRosterPickerOpen && (
              <>
                <div className="fixed inset-0 z-20"
                  onClick={() => setIsRosterPickerOpen(false)} />
                <div className="absolute top-full left-0 mt-2 z-[60]
                  bg-white dark:bg-gray-900 border border-gray-200
                  dark:border-gray-800 rounded-2xl shadow-2xl p-4 w-[280px]
                  animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <button onClick={(e) => {
                      e.stopPropagation();
                      const [y, m] = pickerMonth.split("-").map(Number);
                      const d = new Date(y, m - 2, 1);
                      setPickerMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
                    }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {new Date(pickerMonth + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                    </p>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      const [y, m] = pickerMonth.split("-").map(Number);
                      const d = new Date(y, m, 1);
                      setPickerMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
                    }} disabled={pickerMonth >= todayStr.substring(0, 7)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 disabled:opacity-20 disabled:cursor-not-allowed">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-7 mb-2">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <div key={d} className="text-[10px] font-bold text-gray-400 text-center py-1 uppercase tracking-tight">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {pickerDays.map((day, idx) => {
                      if (!day) return <div key={idx} />;
                      const dayNum = parseInt(day.split("-")[2]);
                      const isSelected = day === rosterDate;
                      const isToday2 = day === todayStr;
                      const isFuture = day > todayStr;
                      return (
                        <button key={day}
                          onClick={() => { if (!isFuture) { setRosterDate(day); setIsRosterPickerOpen(false); } }}
                          disabled={isFuture}
                          className={`h-8 w-8 text-xs font-semibold rounded-lg flex items-center justify-center transition-all
                            ${isFuture ? "text-gray-200 dark:text-gray-700 cursor-not-allowed opacity-50"
                              : isSelected ? "bg-indigo-600 text-white shadow-lg shadow-indigo-300/50 dark:shadow-indigo-900/50 scale-110 z-10"
                                : isToday2 ? "text-indigo-600 dark:text-indigo-400 font-bold ring-2 ring-inset ring-indigo-500/30"
                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Search + prev/next day */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group">
              <input type="text" placeholder="Search roster..."
                value={rosterSearchTerm}
                onChange={(e) => setRosterSearchTerm(e.target.value)}
                className="h-10 w-full sm:w-56 pl-10 pr-4 bg-white dark:bg-gray-800
                  border border-gray-200 dark:border-gray-700 rounded-xl
                  text-sm font-semibold focus:outline-none focus:ring-4
                  focus:ring-indigo-500/10 focus:border-indigo-500
                  transition-all shadow-sm"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-indigo-500"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex w-full sm:w-auto bg-gray-100/80 dark:bg-gray-800 p-1 rounded-xl
              shadow-inner border border-gray-200/50 dark:border-gray-700/50 group">
              <button onClick={() => {
                const d = new Date(rosterDate); d.setDate(d.getDate() - 1);
                setRosterDate(d.toISOString().split("T")[0]);
              }} title="Previous Day"
                className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg
                  text-gray-500 dark:text-gray-400 transition-all
                  hover:text-indigo-600 shadow-sm hover:shadow active:scale-90 flex-1 sm:flex-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={() => setRosterDate(todayStr)}
                className="px-6 py-2 text-[10px] font-black uppercase tracking-widest
                  text-gray-500 dark:text-gray-400 hover:text-indigo-600
                  dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-2 flex-[2] sm:flex-none">
                <span className={`w-2 h-2 rounded-full ${rosterDate === todayStr ? "bg-indigo-500 animate-pulse" : "bg-gray-300 dark:bg-gray-600"}`} />
                {rosterDate === todayStr ? "Today" : "Go to Today"}
              </button>
              <button onClick={() => {
                const d = new Date(rosterDate); d.setDate(d.getDate() + 1);
                const dStr = d.toISOString().split("T")[0];
                if (dStr <= todayStr) setRosterDate(dStr);
              }} disabled={rosterDate >= todayStr} title="Next Day"
                className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg
                  text-gray-500 dark:text-gray-400 transition-all hover:text-indigo-600
                  shadow-sm hover:shadow active:scale-90
                  disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-500 flex-1 sm:flex-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Roster micro-stats + CSV export */}
        <div className="hidden md:flex items-center gap-4">
          {filteredDailyLogs.length > 0 && (
            <button
              onClick={() => exportToCSV(filteredDailyLogs, `roster_${rosterDate}.csv`)}
              className="flex items-center gap-1.5 px-3 py-1.5
                bg-white dark:bg-gray-900 border border-gray-200
                dark:border-gray-800 rounded-lg text-xs font-semibold
                text-gray-500 dark:text-gray-400
                hover:bg-emerald-50 dark:hover:bg-emerald-950/30
                hover:text-emerald-700 dark:hover:text-emerald-400
                hover:border-emerald-300 dark:hover:border-emerald-800
                transition-all shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor"
                viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          )}
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Active Punch</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm font-mono font-bold text-gray-700 dark:text-gray-300">
                {dailyLogs.filter((l) => !l.punchOutTime).length}
              </span>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Total Logs</span>
            <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {dailyLogs.length}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Roster table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800
              bg-gray-50/70 dark:bg-gray-900/70">
              {["Employee", "Punch In", "Punch Out", "Payable Time",
                "Overtime", "Status", ...(isManager ? ["Actions"] : [])].map((col) => (
                  <th key={col} className="text-left px-5 py-3 text-xs font-semibold
                  text-gray-500 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading && [...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            {!isLoading && filteredDailyLogs.length === 0 && (
              <tr><td colSpan={7}>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">
                    No punches recorded on this day.
                  </p>
                </div>
              </td></tr>
            )}
            {!isLoading && filteredDailyLogs.map((log) => {
              const sc = STATUS_CONFIG[log.attendanceStatus];
              return (
                <tr key={log.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-gray-900 dark:text-white">{log.fullName}</p>
                    <p className="text-xs font-mono text-gray-500">{log.employeeCode}</p>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-gray-700 dark:text-gray-300">
                    {formatTime(log.punchInTime)}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-gray-700 dark:text-gray-300">
                    {log.punchOutTime
                      ? formatTime(log.punchOutTime)
                      : <LiveSessionTimer startTime={log.punchInTime!} />}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-gray-700 dark:text-gray-300">
                    {formatMinutes(log.calculatedPayableMinutes)}
                  </td>
                  <td className="px-5 py-3.5">
                    {log.overtime && log.overtimeMinutes > 0 ? (
                      <span className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 text-xs font-semibold font-mono">
                        +{formatMinutes(log.overtimeMinutes)}
                        {log.isOvertimeApproved === true && (
                          <span className="text-emerald-500" title="Approved">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </span>
                        )}
                        {log.isOvertimeApproved === false && (
                          <span className="text-amber-400 text-[10px] font-bold">Pending</span>
                        )}
                      </span>
                    ) : <span className="text-gray-300 dark:text-gray-700">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1 ${sc.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </td>
                  {isManager && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {log.correctionStatus === "PENDING" && (
                          <button
                            onClick={() => setReviewTarget(log)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5
                              bg-indigo-600 hover:bg-indigo-700 text-white
                              text-[11px] font-bold rounded-lg shadow-sm
                              shadow-indigo-200 dark:shadow-indigo-900/40 transition-all
                              animate-pulse hover:animate-none"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Review
                          </button>
                        )}
                        {log.overtime && log.overtimeMinutes > 0 && !log.isOvertimeApproved && (
                          <button
                            onClick={() => setOtApproveTarget(log)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5
                              bg-violet-600 hover:bg-violet-700 text-white
                              text-[11px] font-bold rounded-lg shadow-sm
                              shadow-violet-200 dark:shadow-violet-900/40 transition-all active:scale-95"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Approve OT
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Roster Cards */}
      <div className="flex flex-col gap-4 md:hidden px-4 pb-8 mt-4">
        {!isLoading && filteredDailyLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50/50 dark:bg-gray-800/10 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">
              No punches recorded on this day.
            </p>
          </div>
        )}
        {!isLoading && filteredDailyLogs.map((log) => {
          const sc = STATUS_CONFIG[log.attendanceStatus];
          return (
            <div key={log.id} className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-[2rem] p-5 shadow-sm active:scale-[0.98] transition-all">
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 font-black text-xs">
                    {log.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">{log.fullName}</p>
                    <p className="text-[10px] font-mono font-bold text-gray-400 mt-0.5">{log.employeeCode}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest rounded-full px-3 py-1 ${sc.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {sc.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100/50 dark:border-gray-800/50">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Punch In</p>
                  <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
                    {formatTime(log.punchInTime)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Punch Out</p>
                  <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
                    {log.punchOutTime ? formatTime(log.punchOutTime) : <LiveSessionTimer startTime={log.punchInTime!} />}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4 px-1">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Payable</p>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      {formatMinutes(log.calculatedPayableMinutes)}
                    </p>
                  </div>
                  {log.overtime && log.overtimeMinutes > 0 && (
                    <div>
                      <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-0.5">Overtime</p>
                      <p className="text-xs font-black text-violet-600 dark:text-violet-400">
                        +{formatMinutes(log.overtimeMinutes)}
                      </p>
                    </div>
                  )}
                </div>

                {isManager && (
                  <div className="flex gap-2">
                    {log.correctionStatus === "PENDING" && (
                      <button onClick={() => setReviewTarget(log)} className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                    )}
                    {log.overtime && log.overtimeMinutes > 0 && !log.isOvertimeApproved && (
                      <button onClick={() => setOtApproveTarget(log)} className="p-2 bg-violet-600 text-white rounded-xl shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
