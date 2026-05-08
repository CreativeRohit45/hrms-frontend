// ═══════════════════════════════════════════════════════════════════
//  AttendanceCalendar — 7-day CSS grid calendar view (desktop only).
//  Pure presentation, no business logic.
// ═══════════════════════════════════════════════════════════════════
import { getServerNow } from "../../../utils/serverTime";
import { formatMinutes, type AttendanceLogResponse } from "../../../types/attendance";
import { STATUS_CONFIG } from "./shared";

interface AttendanceCalendarProps {
  calendarDays: (string | null)[];
  logs: AttendanceLogResponse[];
  weekendDaysStr: string;
  holidays: string[];
}

export function AttendanceCalendar({
  calendarDays, logs, weekendDaysStr, holidays,
}: AttendanceCalendarProps) {
  const serverNow = getServerNow();
  const calendarTodayStr = `${serverNow.getFullYear()}-${String(serverNow.getMonth() + 1).padStart(2, "0")}-${String(serverNow.getDate()).padStart(2, "0")}`;

  return (
    <div className="hidden md:block p-5">
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-800
        border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="bg-gray-50 dark:bg-gray-900/80 py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
        {calendarDays.map((dateStr: string | null, i: number) => {
          if (!dateStr) return <div key={`e-${i}`} className="bg-gray-50/30 dark:bg-gray-900/20 min-h-[120px]" />;
          const dayNum = parseInt(dateStr.split("-")[2]);
          const log = logs.find((l) => l.workDate === dateStr);
          const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const weekendArray = weekendDaysStr.split(",").map((s) => s.trim().toLowerCase());
          const isWeekend = weekendArray.includes(dayNames[i % 7].toLowerCase());
          const isHoliday = holidays.includes(dateStr);

          const isToday = dateStr === calendarTodayStr;
          const isFuture = dateStr > calendarTodayStr;

          let dayStatus: { label: string; dot: string; badge: string } | null = null;
          if (log) {
            dayStatus = STATUS_CONFIG[log.attendanceStatus];
          } else if (!isFuture && !isWeekend && !isHoliday && dateStr !== calendarTodayStr) {
            dayStatus = {
              label: "Absent",
              dot: "bg-red-500",
              badge: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800"
            };
          } else if (!isFuture && isHoliday) {
            dayStatus = {
              label: "Holiday",
              dot: "bg-violet-500",
              badge: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-800"
            };
          } else if (!isFuture && isWeekend) {
            dayStatus = {
              label: "Weekend",
              dot: "bg-gray-400",
              badge: "bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700"
            };
          }

          return (
            <div key={dateStr} className={`bg-white dark:bg-gray-900 min-h-[120px] p-3 flex flex-col transition-all duration-200
              ${isToday ? "ring-2 ring-inset ring-indigo-500 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)] dark:shadow-[inset_0_0_20px_rgba(99,102,241,0.2)] z-10 relative bg-indigo-50/30 dark:bg-indigo-900/20"
                : "hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-default"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors
                  ${isToday ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/50"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                  {dayNum}
                </span>
                {log && log.overtimeMinutes > 0 && (
                  <span className="text-[10px] font-bold text-violet-500 flex items-center">
                    <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    +{Math.floor(log.overtimeMinutes / 60)}h
                  </span>
                )}
              </div>
              <div className="mt-auto pt-2 flex flex-wrap items-center justify-between gap-1">
                {dayStatus ? (
                  <div className="flex flex-col items-start gap-1">
                    {log?.late && (
                      <span className="inline-flex items-center text-[9px] font-black uppercase sm:normal-case tracking-widest sm:tracking-normal bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60 rounded-full px-2 py-0.5">
                        Late
                      </span>
                    )}
                    <span className={`inline-flex items-center text-[10px] font-bold rounded-full px-2 py-0.5 truncate ${dayStatus.badge}`}>
                      <span className="truncate">{dayStatus.label}</span>
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-400 dark:text-gray-600 font-medium pl-1">
                    {isFuture ? "—" : "No record"}
                  </span>
                )}
                {log && (log.punchInTime || log.calculatedPayableMinutes !== null) && (
                  <div className="pr-1 flex items-center gap-1.5">
                    {log.punchInTime && !log.punchOutTime ? (
                      <span className="text-[10px] font-medium text-amber-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" /> Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-medium text-gray-400 dark:text-gray-500">
                        {log.calculatedPayableMinutes ? formatMinutes(log.calculatedPayableMinutes) : "—"}
                      </span>
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
