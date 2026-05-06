import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  formatMinutes,
  formatTime,
  formatWorkDate,
  type AttendanceLogResponse,
} from "../../../types/attendance";
import { STATUS_CONFIG, LiveSessionTimer } from "./shared";
import { DataTable, type ColumnDef } from "../../../components/ui/DataTable";
import { ActionSheet } from "../../../components/ui/ActionSheet";

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

  const columns = useMemo<ColumnDef<AttendanceLogResponse>[]>(() => {
    const cols: ColumnDef<AttendanceLogResponse>[] = [
      {
        header: "Date",
        cell: (log) => {
          const isToday = log.workDate === todayStr;
          return (
            <div className="flex items-center gap-2">
              {isToday && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
              <div>
                <p className={`text-sm font-medium flex items-center gap-1.5 ${isToday ? "text-indigo-700 dark:text-indigo-300" : "text-gray-800 dark:text-gray-200"}`}>
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
          );
        }
      },
      {
        header: "Session",
        cell: (log) => (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${log.locationVerifiedIn ? "bg-emerald-400" : "bg-red-400"}`} />
              <span className="font-mono text-[11px] font-bold text-gray-700 dark:text-gray-300">
                {formatTime(log.punchInTime)}
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">In</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${log.punchOutTime ? (log.locationVerifiedOut ? "bg-emerald-400" : "bg-red-400") : "bg-indigo-400 animate-pulse"}`} />
              <span className="font-mono text-[11px] font-bold text-gray-700 dark:text-gray-300">
                {log.punchOutTime ? formatTime(log.punchOutTime) : <LiveSessionTimer startTime={log.punchInTime!} />}
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Out</span>
            </div>
          </div>
        )
      },
      {
        header: "Duration",
        cell: (log) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[11px] font-mono font-bold text-gray-800 dark:text-gray-200">
                {formatMinutes(log.calculatedPayableMinutes)}
              </span>
              <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Work</span>
            </div>
            {log.overtime && log.overtimeMinutes > 0 && (
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-violet-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-[11px] font-mono font-bold text-violet-600 dark:text-violet-400">
                  +{formatMinutes(log.overtimeMinutes)}
                </span>
                <span className="text-[9px] text-violet-400 uppercase font-black tracking-widest">OT</span>
                {log.isOvertimeApproved === false && (
                  <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" title="Pending Approval" />
                )}
              </div>
            )}
          </div>
        )
      },
      {
        header: "Status",
        cell: (log) => {
          const sc = STATUS_CONFIG[log.attendanceStatus];
          return (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold rounded-full px-2 py-0.5 ${sc.badge}`}>
                <span className={`w-1 h-1 rounded-full flex-shrink-0 ${sc.dot}`} />
                {sc.label}
                {log.correctionStatus === "APPROVED" && (
                  <span className="ml-0.5 text-emerald-500" title="Regularized Attendance">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </span>
              {log.correctionStatus === "REJECTED" && (
                <span title={`Rejected: ${log.correctionReason}`} className="text-red-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </span>
              )}
            </div>
          );
        }
      }
    ];

    if (isManager) {
      cols.push({
        header: "Actions",
        cell: (log) => (
          <div className="flex items-center gap-1.5">
            {log.correctionStatus === "PENDING" ? (
              <button
                onClick={() => setReviewTarget(log)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-md transition-all animate-pulse hover:animate-none"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Review
              </button>
            ) : (
              <button
                onClick={() => setCorrectionTarget(log)}
                className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50"
                title="Regularize"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}

            {log.overtime && log.overtimeMinutes > 0 && !log.isOvertimeApproved && (
              <button
                onClick={() => setOtApproveTarget(log)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-md transition-all active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Approve OT
              </button>
            )}
          </div>
        )
      });
    } else {
      cols.push({
        header: "",
        cell: (log) => {
          const canRequestCorrection = log.correctionStatus !== "PENDING" && (log.correctionStatus === "NONE" || log.correctionStatus === "REJECTED");
          const isLocked = payrollLockDate && log.workDate <= payrollLockDate;

          return (
            <div className="flex items-center justify-end w-full">
              {canRequestCorrection && (
                isLocked ? (
                  <span className="text-[10px] text-gray-400 italic flex items-center gap-1" title="Locked for Payroll">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Locked
                  </span>
                ) : (
                  <button
                    onClick={() => setCorrectionTarget(log)}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-100 transition-all whitespace-nowrap"
                  >
                    Regularize
                  </button>
                )
              )}
              {log.correctionStatus === "PENDING" && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                  Reviewing...
                </span>
              )}
            </div>
          );
        }
      });
    }

    return cols;
  }, [isManager, todayStr, payrollLockDate, setCorrectionTarget, setReviewTarget, setOtApproveTarget]);

  const [selectedLog, setSelectedLog] = useState<AttendanceLogResponse | null>(null);

  return (
    <>
      {/* Desktop List View Table */}
      <div className={`hidden md:${viewMode === 'calendar' ? 'hidden' : 'block'}`}>
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          rowClassName={(log) => log.workDate === todayStr ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""}
          emptyState={
            !error && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">No records found</p>
                <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">No attendance data for this period</p>
              </div>
            )
          }
        />
      </div>

      {/* ActionSheet for Mobile Actions */}
      <ActionSheet
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Attendance Actions"
        description={selectedLog ? `Actions for ${formatWorkDate(selectedLog.workDate)}` : undefined}
        items={[
          ...(selectedLog && isManager ? [
            {
              label: "Regularize Record",
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
              onClick: () => { setCorrectionTarget(selectedLog); setSelectedLog(null); }
            }
          ] : []),
          ...(selectedLog && isManager && selectedLog.correctionStatus === "PENDING" ? [
            {
              label: "Review Correction",
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              onClick: () => { setReviewTarget(selectedLog); setSelectedLog(null); }
            }
          ] : []),
          ...(selectedLog && isManager && selectedLog.overtime && selectedLog.overtimeMinutes > 0 && !selectedLog.isOvertimeApproved ? [
            {
              label: "Approve Overtime",
              icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
              onClick: () => { setOtApproveTarget(selectedLog); setSelectedLog(null); }
            }
          ] : []),
          ...(selectedLog && !isManager && selectedLog.correctionStatus !== "PENDING" && (selectedLog.correctionStatus === "NONE" || selectedLog.correctionStatus === "REJECTED") ? [
            {
              label: "Request Regularization",
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
              onClick: () => { setCorrectionTarget(selectedLog); setSelectedLog(null); }
            }
          ] : [])
        ]}
      />

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

                    const hasActions = isManager || canRequestCorrection;

                    return (
                      <div
                        key={log.id}
                        onClick={() => hasActions && setSelectedLog(log)}
                        className={`bg-white dark:bg-gray-950 border rounded-[2rem] p-5 shadow-sm transition-all
                        ${hasActions ? "cursor-pointer active:scale-[0.98]" : ""}
                        ${isToday ? "border-indigo-200 dark:border-indigo-800/50" : "border-gray-100 dark:border-gray-800"}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Work Date</p>
                              {isToday && <span className="text-[8px] px-1.5 py-0.5 bg-indigo-500 text-white rounded font-black uppercase tracking-tighter">Today</span>}
                            </div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{formatWorkDate(log.workDate)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest rounded-full px-2.5 py-1 ${sc.badge}`}>
                              <span className={`w-1 h-1 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </span>
                            {/* Manager Action Indicators */}
                            {isManager && (
                              <div className="flex flex-col items-end gap-1">
                                {log.correctionStatus === "PENDING" && (
                                  <span className="text-[8px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded shadow-sm animate-pulse">Review Req</span>
                                )}
                                {log.overtime && log.overtimeMinutes > 0 && !log.isOvertimeApproved && (
                                  <span className="text-[8px] font-black bg-violet-600 text-white px-2 py-0.5 rounded shadow-sm animate-pulse">Approve OT</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Modular Grid Layout for Times */}
                        <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                          <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Punch In</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                {formatTime(log.punchInTime)}
                              </p>
                              {log.punchInTime && <span className={`w-1 h-1 rounded-full ${log.locationVerifiedIn ? "bg-emerald-400" : "bg-red-400"}`} />}
                            </div>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Punch Out</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                {log.punchOutTime ? formatTime(log.punchOutTime) : <LiveSessionTimer startTime={log.punchInTime!} />}
                              </p>
                              {log.punchOutTime && log.locationVerifiedOut !== null && <span className={`w-1 h-1 rounded-full ${log.locationVerifiedOut ? "bg-emerald-400" : "bg-red-400"}`} />}
                            </div>
                          </div>
                        </div>

                        {/* Footer Stat Row */}
                        <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4 px-1">
                          <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Work Hours</p>
                              <p className="text-xs font-black text-gray-900 dark:text-white">{formatMinutes(log.calculatedPayableMinutes)}</p>
                            </div>
                            {log.overtime && log.overtimeMinutes > 0 && (
                              <div className="flex flex-col">
                                <p className="text-[8px] font-black text-violet-400 uppercase tracking-widest mb-0.5">Overtime</p>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-black text-violet-600 dark:text-violet-400">+{formatMinutes(log.overtimeMinutes)}</p>
                                  {!log.isOvertimeApproved && <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {hasActions ? (
                              <div className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 rounded-full border border-indigo-100 dark:border-indigo-900/50 transition-all active:scale-90 shadow-sm">
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            ) : (
                              log.correctionStatus === "PENDING" && (
                                <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 uppercase tracking-widest bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-xl border border-amber-100 dark:border-amber-900/50">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  Reviewing
                                </span>
                              )
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
