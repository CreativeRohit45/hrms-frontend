// ═══════════════════════════════════════════════════════════════════
//  AttendanceList — Desktop table + Mobile weekly accordion cards.
//  Pure presentation, no business logic.
// ═══════════════════════════════════════════════════════════════════
import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  formatMinutes,
  formatTime,
  formatWorkDate,
  type AttendanceLogResponse,
} from "../../../types/attendance";
import { STATUS_CONFIG, LiveSessionTimer, SkeletonRow } from "./shared";

interface WeekGroup {
  id: string;
  label: string;
  dateRange: string;
  logs: AttendanceLogResponse[];
}

interface AttendanceListProps {
  viewMode: "calendar" | "list" | "roster";
  filtered: AttendanceLogResponse[];
  groupedWeeks: WeekGroup[];
  expandedWeek: string | null;
  setExpandedWeek: (w: string | null) => void;
  isLoading: boolean;
  error: string | null;
  isManager: boolean;
  todayStr: string;
  payrollLockDate: string | null;
  setCorrectionTarget: (log: AttendanceLogResponse | null) => void;
  setReviewTarget: (log: AttendanceLogResponse | null) => void;
  setOtApproveTarget: (log: AttendanceLogResponse | null) => void;
}

export function AttendanceList({
  viewMode, filtered, groupedWeeks, expandedWeek, setExpandedWeek,
  isLoading, error, isManager, todayStr, payrollLockDate,
  setCorrectionTarget, setReviewTarget, setOtApproveTarget,
}: AttendanceListProps) {
  return (
    <>
      {/* Desktop List View Table */}
      <div className={`hidden md:${viewMode === 'calendar' ? 'hidden' : 'block'} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800
            bg-gray-50/70 dark:bg-gray-900/70">
              {["Date", "Punch In", "Punch Out", "Total Hours",
                "Overtime", "Status",
                ...(isManager ? ["Actions"] : [""])].map((col) => (
                  <th key={col} className="text-left px-5 py-3 text-xs font-semibold
                    text-gray-500 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading && [...Array(8)].map((_, i) => <SkeletonRow key={i} />)}
            {!isLoading && !error && filtered.length === 0 && (
              <tr><td colSpan={8}>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800
                  border border-gray-200 dark:border-gray-700 flex items-center
                  justify-center mb-3">
                    <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none"
                      stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">No records found</p>
                  <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">No attendance data for this period</p>
                </div>
              </td></tr>
            )}
            {!isLoading && filtered.map((log) => {
              const sc = STATUS_CONFIG[log.attendanceStatus];
              const isToday = log.workDate === todayStr;
              const canRequestCorrection =
                log.correctionStatus !== "PENDING" &&
                (isManager || log.correctionStatus === "NONE" || log.correctionStatus === "REJECTED");

              return (
                <tr key={log.id}
                  className={`group transition-colors duration-100
                  hover:bg-gray-50 dark:hover:bg-gray-800/50
                  ${isToday ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""}`}>

                  {/* Date */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {isToday && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
                      <div>
                        <p className={`text-sm font-medium flex items-center gap-1.5
                        ${isToday ? "text-indigo-700 dark:text-indigo-300" : "text-gray-800 dark:text-gray-200"}`}>
                          {formatWorkDate(log.workDate)}
                          {isToday && (
                            <>
                              <span className="text-gray-300 dark:text-gray-600 font-normal">•</span>
                              <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider">Today</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Punch In */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                        {formatTime(log.punchInTime)}
                      </span>
                      {log.punchInTime && (
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                        ${log.locationVerifiedIn ? "bg-emerald-400" : "bg-red-400"}`}
                          title={log.locationVerifiedIn ? "Location verified" : "Location not verified"} />
                      )}
                    </div>
                  </td>

                  {/* Punch Out */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        {log.punchOutTime ? (
                          <>
                            {formatTime(log.punchOutTime)}
                            {log.punchInTime && log.punchOutTime.substring(0, 10) !== log.punchInTime.substring(0, 10) && (
                              <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 py-0.5 px-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded border border-indigo-100 dark:border-indigo-800 tracking-tighter" title="Punched out on the next day">
                                +1 DAY
                              </span>
                            )}
                          </>
                        ) : (
                          <LiveSessionTimer startTime={log.punchInTime!} />
                        )}
                      </span>
                      {log.punchOutTime && log.locationVerifiedOut !== null && (
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                        ${log.locationVerifiedOut ? "bg-emerald-400" : "bg-red-400"}`}
                          title={log.locationVerifiedOut ? "Location verified" : "Location not verified"} />
                      )}
                    </div>
                  </td>

                  {/* Total Hours */}
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                      {formatMinutes(log.calculatedPayableMinutes)}
                    </span>
                  </td>

                  {/* Overtime */}
                  <td className="px-5 py-3.5">
                    {log.overtime && log.overtimeMinutes > 0 ? (
                      <span className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 text-xs font-semibold font-mono">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {formatMinutes(log.overtimeMinutes)}
                        {log.isOvertimeApproved === true && (
                          <span className="text-emerald-500" title="Approved">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </span>
                        )}
                        {log.isOvertimeApproved === false && (
                          <span className="text-[10px] text-amber-400 font-bold">Pending</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-700 text-sm">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1 ${sc.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                        {sc.label}
                        {log.correctionStatus === "APPROVED" && (
                          <span className="ml-0.5 text-emerald-500" title="Regularized Attendance">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </span>
                      {log.correctionStatus === "REJECTED" && (
                        <span title={`Rejected: ${log.correctionReason}`} className="text-red-500">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Management Actions */}
                  {isManager && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCorrectionTarget(log)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5
                          bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
                          hover:text-indigo-600 dark:hover:text-indigo-400
                          text-[11px] font-bold rounded-lg border border-gray-200
                          dark:border-gray-700 transition-all active:scale-95"
                          title="Manual Regularization"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Regularize
                        </button>
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

                  {/* Employee correction actions */}
                  {!isManager && (
                    <td className="px-5 py-3.5">
                      {canRequestCorrection && (
                        (() => {
                          const isLocked = payrollLockDate && log.workDate <= payrollLockDate;
                          if (isLocked) {
                            return (
                              <span className="text-[10px] text-gray-400 italic flex items-center gap-1" title="Locked for Payroll">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                Locked
                              </span>
                            );
                          }
                          return (
                            <button
                              onClick={() => setCorrectionTarget(log)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5
                              text-[11px] font-semibold rounded-lg
                              text-gray-500 dark:text-gray-400
                              bg-gray-50 dark:bg-gray-800
                              border border-gray-200 dark:border-gray-700
                              hover:bg-indigo-50 dark:hover:bg-indigo-950/40
                              hover:text-indigo-600 dark:hover:text-indigo-400
                              hover:border-indigo-300 dark:hover:border-indigo-800
                              transition-all whitespace-nowrap"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              {log.correctionStatus === "APPROVED" ? "Update Record" : log.correctionStatus === "REJECTED" ? "Re-regularize" : "Regularize"}
                            </button>
                          );
                        })()
                      )}
                      {log.correctionStatus === "PENDING" && (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Under Review
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Attendance Cards with Weekly Accordions */}
      <div className="flex flex-col gap-3 md:hidden px-4 pb-8 mt-4">
        {!isLoading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50/50 dark:bg-gray-800/10 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">No attendance records found.</p>
          </div>
        )}

        {!isLoading && groupedWeeks.map((week) => {
          const isOpen = expandedWeek === week.id;

          return (
            <div key={week.id} className="overflow-hidden bg-gray-50/50 dark:bg-gray-800/20 rounded-[2rem] border border-gray-100 dark:border-gray-800">
              {/* Week Header */}
              <button
                onClick={() => setExpandedWeek(isOpen ? null : week.id)}
                className="w-full h-14 px-6 flex items-center justify-between transition-colors hover:bg-white dark:hover:bg-gray-900"
              >
                <div className="flex flex-col items-start text-left">
                  <p className="text-[10px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-widest">{week.label}</p>
                  <p className="text-[11px] font-bold text-gray-500">{week.dateRange}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-black bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500">
                    {week.logs.length}
                  </span>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {/* Week Content */}
              <div className={`transition-all duration-300 ease-in-out ${isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"}`}>
                <div className="flex flex-col gap-3 p-3 pt-0">
                  {week.logs.map((log) => {
                    const sc = STATUS_CONFIG[log.attendanceStatus];
                    const isToday = log.workDate === todayStr;
                    const canRequestCorrection =
                      log.correctionStatus !== "PENDING" &&
                      (isManager || log.correctionStatus === "NONE" || log.correctionStatus === "REJECTED");

                    return (
                      <div key={log.id} className={`bg-white dark:bg-gray-950 border rounded-[2rem] p-5 shadow-sm active:scale-[0.98] transition-all
                      ${isToday ? "border-indigo-200 dark:border-indigo-800/50" : "border-gray-100 dark:border-gray-800"}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Work Date</p>
                              {isToday && <span className="text-[8px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded font-black uppercase tracking-tighter">Today</span>}
                            </div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{formatWorkDate(log.workDate)}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest rounded-full px-2.5 py-1 ${sc.badge}`}>
                            <span className={`w-1 h-1 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-100/50 dark:border-gray-800/50">
                          <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">In</p>
                            <div className="flex items-center gap-1">
                              <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                {formatTime(log.punchInTime)}
                              </p>
                              {log.punchInTime && <span className={`w-1 h-1 rounded-full ${log.locationVerifiedIn ? "bg-emerald-400" : "bg-red-400"}`} />}
                            </div>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Out</p>
                            <div className="flex items-center gap-1">
                              <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                {log.punchOutTime ? formatTime(log.punchOutTime) : <LiveSessionTimer startTime={log.punchInTime!} />}
                              </p>
                              {log.punchOutTime && log.locationVerifiedOut !== null && <span className={`w-1 h-1 rounded-full ${log.locationVerifiedOut ? "bg-emerald-400" : "bg-red-400"}`} />}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4 px-1">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Hours</p>
                              <p className="text-xs font-black text-gray-900 dark:text-white">{formatMinutes(log.calculatedPayableMinutes)}</p>
                            </div>
                            {log.overtime && log.overtimeMinutes > 0 && (
                              <div className="flex flex-col">
                                <p className="text-[8px] font-black text-violet-400 uppercase tracking-widest">OT</p>
                                <p className="text-[10px] font-black text-violet-600 dark:text-violet-400">+{formatMinutes(log.overtimeMinutes)}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {isManager ? (
                              <div className="flex gap-1.5">
                                <button onClick={() => setCorrectionTarget(log)} className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm" title="Regularize">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                {log.correctionStatus === "PENDING" && (
                                  <button onClick={() => setReviewTarget(log)} className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  </button>
                                )}
                                {log.overtime && log.overtimeMinutes > 0 && !log.isOvertimeApproved && (
                                  <button onClick={() => setOtApproveTarget(log)} className="p-2 bg-violet-600 text-white rounded-xl shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <>
                                {log.correctionStatus === "PENDING" && (
                                  <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-lg border border-amber-100 dark:border-amber-900/50">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Review
                                  </span>
                                )}
                                {!isManager && canRequestCorrection && (
                                  <button onClick={() => setCorrectionTarget(log)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-700 hover:text-indigo-600 transition-all font-bold text-[10px]">
                                    Regularize
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
