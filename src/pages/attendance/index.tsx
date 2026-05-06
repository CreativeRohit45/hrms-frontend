// ═══════════════════════════════════════════════════════════════════
//  Attendance Orchestrator — TanStack Query powered.
//  All presentation extracted to ./components/.
//  Data layer: useMyAttendanceLogs, useEmployeeLogs, useDailyRosterLogs,
//  useAttendanceDashboardStats + mutation hooks.
// ═══════════════════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { getServerNow } from "../../utils/serverTime";
import {
  formatMinutes,
  formatTime,
  formatWorkDate,
  type AttendanceLogResponse,
} from "../../types/attendance";
import type { EmployeeResponse } from "../../types/employee";
import { useAuth } from "../../context/AuthContext";
import { useAllEmployees } from "../../hooks/queries/useEmployees";
import { TimePickerField, parseTimeToParts } from "../../components/ui/TimePickerField";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { useAppToast } from "../../components/ui/ToastProvider";

// ── TanStack Query hooks ──────────────────────────────────────────
import {
  useMyAttendanceLogs,
  useEmployeeLogs,
  useAttendanceDashboardStats,
  useRequestCorrection,
  useApproveCorrection,
  useRejectCorrection,
  useApproveOvertimeMutation,
} from "../../hooks/queries/useAttendance";

// ── Extracted components ──────────────────────────────────────────
import { StatCard, getMonthOptions, generateCalendarGrid } from "./components/shared";
import { AttendanceToolbar } from "./components/AttendanceToolbar";
import { AttendanceCalendar } from "./components/AttendanceCalendar";
import { AttendanceList } from "./components/AttendanceList";

// ── Correction Request Modal ──────────────────────────────────────
interface CorrectionModalProps {
  log: AttendanceLogResponse;
  employeeCode: string;
  onClose: () => void;
  onSuccess: () => void;
}

function CorrectionModal({ log, employeeCode, onClose, onSuccess }: CorrectionModalProps) {
  const [inTime, setInTime] = useState(parseTimeToParts(log.punchInTime));
  const [outTime, setOutTime] = useState(parseTimeToParts(log.punchOutTime));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const correctionMutation = useRequestCorrection(employeeCode);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for regularization.");
      return;
    }

    const toLocalISO = (parts: { h: string, m: string, p: string }, offsetDay = 0) => {
      const { h, m, p } = parts;
      let h24 = parseInt(h);
      if (p === "PM" && h24 < 12) h24 += 12;
      if (p === "AM" && h24 === 12) h24 = 0;

      const d = new Date(`${log.workDate}T00:00:00`);
      d.setHours(h24, parseInt(m), 0);
      if (offsetDay !== 0) d.setDate(d.getDate() + offsetDay);

      const Y = d.getFullYear();
      const M = String(d.getMonth() + 1).padStart(2, "0");
      const D = String(d.getDate()).padStart(2, "0");
      const HH = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${Y}-${M}-${D}T${HH}:${mm}:00`;
    };

    let outOffset = 0;
    if (inTime.p === "PM" && outTime.p === "AM") {
      outOffset = 1;
    }

    const punchInISO = toLocalISO(inTime);
    const punchOutISO = toLocalISO(outTime, outOffset);

    if (new Date(punchOutISO) <= new Date(punchInISO)) {
      setError("Punch-out must be after punch-in.");
      return;
    }

    setError(null);
    try {
      await correctionMutation.mutateAsync({
        logId: log.id, punchIn: punchInISO, punchOut: punchOutISO, reason: reason.trim(),
      });
      onSuccess();
    } catch (err: unknown) {
      setError("Failed to submit. Please check your data.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4
      bg-black/40 dark:bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200
        dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md
        animate-in fade-in zoom-in duration-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
          border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div>
            <p className="text-gray-900 dark:text-gray-100 font-bold text-base">
              Regularize Attendance
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
              {formatWorkDate(log.workDate)} · {log.fullName}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Reference Info */}
          <div className="flex items-center justify-between p-3 bg-indigo-50/30 dark:bg-indigo-950/10
            border border-indigo-100/50 dark:border-indigo-900/20 rounded-xl">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Current Record</p>
              <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-300">
                {formatTime(log.punchInTime)} — {log.punchOutTime ? formatTime(log.punchOutTime) : "--:--"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Shift Time</p>
              <p className="text-xs font-mono font-bold text-gray-500">
                {formatTime(log.shiftStartTime)} — {formatTime(log.shiftEndTime)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <TimePickerField label="Requested Punch-In" parts={inTime} setter={setInTime} />
            <TimePickerField label="Requested Punch-Out" parts={outTime} setter={setOutTime} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Reason for Regularization
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a brief explanation..."
              rows={2}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200
                dark:border-gray-700/50 rounded-xl px-3 py-2 text-sm
                focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
            />
          </div>

          {error && <p className="text-[11px] text-red-500 font-bold text-center">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4
          border-t border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/40">
          <button onClick={onClose} className="text-sm font-semibold text-gray-500">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={correctionMutation.isPending}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white
              text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
          >
            {correctionMutation.isPending ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Correction Review Modal (Manager/Admin only) ──────────────────
interface CorrectionReviewModalProps {
  log: AttendanceLogResponse;
  employeeCode: string;
  onClose: () => void;
  onSuccess: () => void;
}

function CorrectionReviewModal({ log, employeeCode, onClose, onSuccess }: CorrectionReviewModalProps) {
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const approveMutation = useApproveCorrection(employeeCode);
  const rejectMutation = useRejectCorrection(employeeCode);

  const loading = approveMutation.isPending || rejectMutation.isPending;

  const handleApprove = async () => {
    setError(null);
    try {
      await approveMutation.mutateAsync(log.id);
      onSuccess();
    } catch (err: unknown) {
      setError("Failed to approve. Please try again.");
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for rejection.");
      return;
    }
    setError(null);
    try {
      await rejectMutation.mutateAsync({ logId: log.id, reason: reason.trim() });
      onSuccess();
    } catch (err: unknown) {
      setError("Failed to reject. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4
      bg-black/40 dark:bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200
        dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md
        animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
          border-b border-gray-200 dark:border-gray-800">
          <div>
            <p className="text-gray-900 dark:text-gray-100 font-bold text-base">
              Review Regularization Request
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
              {formatWorkDate(log.workDate)} · {log.fullName} ({log.employeeCode})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800
              rounded-lg transition-colors text-gray-400 hover:text-gray-600
              dark:hover:text-gray-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor"
              viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/50">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1.5">Original</span>
              <div className="space-y-1">
                <p className="text-xs font-mono text-gray-500 line-through">In: {formatTime(log.punchInTime)}</p>
                <p className="text-xs font-mono text-gray-500 line-through">Out: {formatTime(log.punchOutTime) || "--:--"}</p>
              </div>
            </div>
            <div className="p-3 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30">
              <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-tighter mb-1.5">Requested</span>
              <div className="space-y-1">
                <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">In: {formatTime(log.requestedPunchInTime)}</p>
                <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">Out: {formatTime(log.requestedPunchOutTime)}</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Reason for request</span>
            <p className="text-sm text-gray-700 dark:text-gray-300 italic font-medium leading-relaxed">
              "{log.correctionReason || "No reason provided"}"
            </p>
          </div>

          {!rejectMode ? (
            <div className="flex flex-col gap-2 pt-2">
              <p className="text-center text-[10px] text-gray-400 font-medium">Approve to overwrite original punch times and recalculate hours.</p>
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-red-500">Rejection Reason *</label>
              <textarea
                autoFocus
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly explain why this is being rejected..."
                className="w-full p-3 text-sm bg-red-50/10 dark:bg-red-950/10 border
                  border-red-200 dark:border-red-900/50 rounded-xl resize-none outline-none focus:ring-2 focus:ring-red-500/20"
                rows={2}
              />
            </div>
          )}

          {error && <p className="text-[11px] text-red-500 font-bold text-center">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4
          border-t border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/40">
          <button onClick={onClose} className="text-sm font-semibold text-gray-500 hover:text-gray-700">Close</button>
          <div className="flex gap-2">
            {!rejectMode ? (
              <>
                <button onClick={() => setRejectMode(true)} disabled={loading}
                  className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all">
                  Reject
                </button>
                <button onClick={handleApprove} disabled={loading}
                  className="px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">
                  {loading ? "..." : "Approve Request"}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setRejectMode(false)} className="px-4 py-2 text-xs font-bold text-gray-500">Back</button>
                <button onClick={handleReject} disabled={!reason.trim() || loading}
                  className="px-6 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg">
                  Confirm Reject
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
//  ORCHESTRATOR — TanStack Query powered state + child routing
// ═══════════════════════════════════════════════════════════════════
export default function AttendancePage() {
  const { user, payrollLockDate } = useAuth();
  const { pushToast } = useAppToast();
  const isManager = user?.role === "SUPER_ADMIN"
    || user?.role === "HR_ADMIN"
    || user?.role === "DEPARTMENT_MANAGER";


  // ── UI-only state (preserved) ──────────────────────────────────
  const [activeEmployeeCode, setActiveEmployeeCode] = useState<string>("me");
  const [searchInput, setSearchInput] = useState<string>("");
  const { data: employeePage } = useAllEmployees(0, 1000, undefined, isManager);
  const employeeList = employeePage?.content ?? [] as EmployeeResponse[];
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const lastAutoMonth = useRef("");

  const getLocalTodayStr = () => {
    const d = getServerNow();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const todayStr = getLocalTodayStr();

  const [otApproveTarget, setOtApproveTarget] = useState<AttendanceLogResponse | null>(null);

  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const d = getServerNow();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  const [correctionTarget, setCorrectionTarget] = useState<AttendanceLogResponse | null>(null);
  const [reviewTarget, setReviewTarget] = useState<AttendanceLogResponse | null>(null);

  const monthOptions = useMemo(getMonthOptions, []);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════════
  //  TANSTACK QUERY — Data layer (replaces fetchLogs + useState)
  // ═══════════════════════════════════════════════════════════════

  // 1. My attendance logs (when viewing own records)
  const myLogsQuery = useMyAttendanceLogs(filterMonth);

  // 2. Employee logs (when manager views another employee)
  const employeeLogsQuery = useEmployeeLogs(
    activeEmployeeCode,
    activeEmployeeCode !== "me",
    filterMonth
  );



  // 4. Dashboard stats (weekend days, holidays)
  const dashboardStatsQuery = useAttendanceDashboardStats(activeEmployeeCode);

  // ── Derived data from queries ─────────────────────────────────
  const rawLogs = useMemo(() => {
    const source = activeEmployeeCode === "me"
      ? myLogsQuery.data
      : employeeLogsQuery.data;
    if (!source) return [];
    return [...source].sort((a, b) => b.workDate.localeCompare(a.workDate));
  }, [activeEmployeeCode, myLogsQuery.data, employeeLogsQuery.data]);

  const logs = rawLogs;

  const isLoading = activeEmployeeCode === "me" ? myLogsQuery.isLoading : employeeLogsQuery.isLoading;

  const error = activeEmployeeCode === "me"
      ? (myLogsQuery.isError ? "Unable to load attendance records. Please try again." : null)
      : (employeeLogsQuery.isError ? "Employee code not found or unable to load records." : null);

  const weekendDaysStr = dashboardStatsQuery.data?.weekendDays ?? "Saturday,Sunday";
  const holidays = dashboardStatsQuery.data?.allHolidays ?? [];

  // ── Overtime mutation ─────────────────────────────────────────
  const overtimeMutation = useApproveOvertimeMutation(activeEmployeeCode);

  const handleApproveOvertime = async () => {
    if (!otApproveTarget) return;
    try {
      await overtimeMutation.mutateAsync(otApproveTarget.id);
      setOtApproveTarget(null);
    } catch (err: any) {
      pushToast({
        tone: "error",
        title: "Overtime approval failed",
        message: err?.message || "Please try again.",
      });
    }
  };

  // ── Refresh helper (for the refresh button) ───────────────────
  const handleRefresh = () => {
    if (activeEmployeeCode === "me") {
      myLogsQuery.refetch();
    } else {
      employeeLogsQuery.refetch();
    }
    dashboardStatsQuery.refetch();
  };

  // Employee list is now loaded via useAllEmployees hook above

  // ── Computed values ───────────────────────────────────────────
  const filtered = useMemo(
    () => logs.filter((log) => log.workDate.startsWith(filterMonth)),
    [logs, filterMonth]
  );

  // ── Weekly Grouping for Mobile ──────────────────────────────────
  const groupedWeeks = useMemo(() => {
    if (!filtered || filtered.length === 0) return [];
    const weeksMap = new Map<string, AttendanceLogResponse[]>();
    filtered.forEach(log => {
      const date = new Date(log.workDate);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date);
      monday.setDate(diff);
      const weekKey = monday.toISOString().split('T')[0];
      if (!weeksMap.has(weekKey)) weeksMap.set(weekKey, []);
      weeksMap.get(weekKey)!.push(log);
    });
    const sortedWeekKeys = Array.from(weeksMap.keys()).sort((a, b) => b.localeCompare(a));
    return sortedWeekKeys.map((key, index) => {
      const weekLogs = weeksMap.get(key)!.sort((a, b) => b.workDate.localeCompare(a.workDate));
      return {
        id: key,
        label: `Week ${sortedWeekKeys.length - index}`,
        dateRange: `${formatWorkDate(weekLogs[weekLogs.length - 1].workDate)} - ${formatWorkDate(weekLogs[0].workDate)}`,
        logs: weekLogs,
      };
    });
  }, [filtered]);

  useEffect(() => {
    if (groupedWeeks.length > 0 && lastAutoMonth.current !== filterMonth) {
      setExpandedWeek(groupedWeeks[0].id);
      lastAutoMonth.current = filterMonth;
    }
  }, [groupedWeeks, filterMonth]);

  // ── Click-outside for search dropdown ──────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedEmployee = useMemo(() => {
    if (activeEmployeeCode === "me") return null;
    return employeeList.find(e => e.employeeCode === activeEmployeeCode);
  }, [activeEmployeeCode, employeeList]);

  const suggestions = useMemo(() => {
    if (!searchInput.trim()) return [];
    const term = searchInput.toLowerCase();
    return employeeList.filter(e =>
      e.fullName.toLowerCase().includes(term) ||
      e.employeeCode.toLowerCase().includes(term)
    ).slice(0, 8);
  }, [searchInput, employeeList]);

  const stats = useMemo(() => {
    const present = filtered.filter((l) =>
      ["PRESENT", "LATE", "HALF_DAY", "WEEKEND_WORK", "HOLIDAY_WORK"].includes(l.attendanceStatus)
    ).length;
    const late = filtered.filter((l) => {
      if (l.attendanceStatus === "LATE") return true;
      if (l.attendanceStatus === "HALF_DAY" && l.punchInTime && l.shiftStartTime) {
        try {
          const datePart = l.workDate;
          const [sH, sM] = l.shiftStartTime.split(':');
          const shiftThreshold = new Date(`${datePart}T${sH}:${sM}:00`).getTime() + (10 * 60 * 1000);
          const punchStr = l.punchInTime.includes('T') ? l.punchInTime : l.punchInTime.replace(' ', 'T');
          const punchTime = new Date(punchStr).getTime();
          return !isNaN(punchTime) && punchTime > shiftThreshold;
        } catch (e) { return false; }
      }
      return false;
    }).length;
    const totalMin = filtered.reduce((acc, l) => acc + (l.calculatedPayableMinutes ?? 0), 0);
    const overtimeMin = filtered.reduce((acc, l) => acc + (l.overtime ? l.overtimeMinutes : 0), 0);

    let absent = 0;
    if (filterMonth) {
      const [yrStr, moStr] = filterMonth.split("-");
      const yr = parseInt(yrStr), mo = parseInt(moStr);
      const daysInMonth = new Date(yr, mo, 0).getDate();
      const today = getServerNow();
      const isCurrentMonth = today.getFullYear() === yr && today.getMonth() + 1 === mo;
      const daysToConsider = isCurrentMonth ? today.getDate() : daysInMonth;
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const weekendArray = weekendDaysStr.split(",").map((s: string) => s.trim().toLowerCase());
      for (let i = 1; i <= daysToConsider; i++) {
        const d = new Date(yr, mo - 1, i);
        const dateStr = `${yr}-${String(mo).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
        const isWeekend = weekendArray.includes(dayNames[d.getDay()].toLowerCase());
        const isHoliday = holidays.includes(dateStr);
        const isToday = dateStr === todayStr;
        if (!isWeekend && !isHoliday && !isToday) {
          const hasValidRecord = filtered.some((l) =>
            l.workDate === dateStr &&
            ["PRESENT", "LATE", "WEEKEND_WORK", "HOLIDAY_WORK", "ON_LEAVE", "HALF_DAY"].includes(l.attendanceStatus)
          );
          if (!hasValidRecord) absent++;
        }
      }
    }
    return { present, absent, late, totalMin, overtimeMin };
  }, [filtered, filterMonth, weekendDaysStr, todayStr, holidays]);

  const calendarDays = useMemo(
    () => (filterMonth ? generateCalendarGrid(filterMonth) : []),
    [filterMonth]
  );

  // ═══════════════════════════════════════════════════════════════
  //  RENDER — Clean child component routing (unchanged)
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="space-y-5">

      {/* ── Correction modal ── */}
      {correctionTarget && (
        <CorrectionModal
          log={correctionTarget}
          employeeCode={activeEmployeeCode}
          onClose={() => setCorrectionTarget(null)}
          onSuccess={() => setCorrectionTarget(null)}
        />
      )}

      {/* ── Review Correction modal (Manager only) ── */}
      {reviewTarget && (
        <CorrectionReviewModal
          log={reviewTarget}
          employeeCode={activeEmployeeCode}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => setReviewTarget(null)}
        />
      )}

      {/* ── Overtime Approval Modal ── */}
      <ConfirmModal
        isOpen={!!otApproveTarget}
        onClose={() => setOtApproveTarget(null)}
        onConfirm={handleApproveOvertime}
        title="Approve Overtime"
        message={`Confirming +${formatMinutes(otApproveTarget?.overtimeMinutes || 0)} overtime for ${otApproveTarget?.fullName}. This will be added to their payroll.`}
        confirmText={overtimeMutation.isPending ? "Approving..." : "Approve Overtime"}
        isDestructive={false}
      />

      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div className="flex flex-col">
          <h1 className="text-gray-900 dark:text-gray-100 text-xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
            {activeEmployeeCode === "me" ? "My Attendance" : "Employee Records"}
          </h1>
          {activeEmployeeCode !== "me" && selectedEmployee && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Viewing: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedEmployee.fullName}</span>
              </span>
              <button
                onClick={() => {
                  setActiveEmployeeCode("me");
                  setSearchInput("");
                }}
                className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider
                  bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400
                  rounded-full border border-gray-200 dark:border-gray-700 transition-all hover:border-indigo-200"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Back to Me
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isManager && (
            <div className="relative" ref={searchContainerRef}>
              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search employee..."
                  className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-900 
                    border border-gray-200 dark:border-gray-700 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                    w-[240px] shadow-sm transition-all"
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Autocomplete Dropdown */}
              {isSearchFocused && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 
                  border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-[100] overflow-hidden 
                  backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="p-1.5">
                    <button
                      onClick={() => {
                        setActiveEmployeeCode("me");
                        setSearchInput("");
                        setIsSearchFocused(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between
                        hover:bg-indigo-50 dark:hover:bg-indigo-900/30 group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                          ME
                        </div>
                        <span className="font-semibold text-gray-700 dark:text-gray-200">Personal Records</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                    </button>

                    {suggestions.map((emp) => (
                      <button
                        key={emp.employeeCode}
                        onClick={() => {
                          setActiveEmployeeCode(emp.employeeCode);
                          setSearchInput(emp.fullName);
                          setIsSearchFocused(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between
                          hover:bg-gray-50 dark:hover:bg-gray-800/60 group transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 font-semibold">
                            {emp.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-100">{emp.fullName}</p>
                            <p className="text-[10px] font-mono text-gray-500">{emp.employeeCode}</p>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">View</span>
                      </button>
                    ))}
                    {searchInput.trim() && suggestions.length === 0 && (
                      <div className="px-3 py-3 text-center">
                        <p className="text-xs text-gray-500 italic">No matches for "{searchInput}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh Attendance Data"
            className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
              text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Present" value={stats.present}
          sub={`${filtered.length} working days`}
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          icon={<svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Absent" value={stats.absent}
          iconBg="bg-red-50 dark:bg-red-950/40"
          icon={<svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Late" value={stats.late}
          iconBg="bg-amber-50 dark:bg-amber-950/40"
          icon={<svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Total Hours" value={formatMinutes(stats.totalMin)}
          sub="payable this period" iconBg="bg-indigo-50 dark:bg-indigo-950/40"
          icon={<svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />
        <StatCard label="Overtime" value={formatMinutes(stats.overtimeMin)}
          sub={stats.overtimeMin > 0 ? "extra hours logged" : "none this period"}
          iconBg="bg-violet-50 dark:bg-violet-950/40"
          icon={<svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/30
          border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none"
            stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-700 dark:text-red-300 text-sm flex-1">{error}</p>
          <button onClick={handleRefresh}
            className="text-red-500 dark:text-red-400 text-xs font-semibold
              hover:text-red-700 dark:hover:text-red-200 transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* ── Main card ── */}
      <div className={`bg-white dark:bg-gray-900 border border-gray-200
        dark:border-gray-800 rounded-xl shadow-card relative animate-in fade-in duration-500`}>

        <AttendanceToolbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          filterMonth={filterMonth}
          setFilterMonth={setFilterMonth}
          monthOptions={monthOptions}
          filtered={filtered}
          activeEmployeeCode={activeEmployeeCode}
          isLoading={isLoading}
        />

        {/* ── LIST VIEW ── */}
        {(viewMode === "list" || viewMode === "calendar") && (
          <AttendanceList
            viewMode={viewMode}
            filtered={filtered}
            groupedWeeks={groupedWeeks}
            expandedWeek={expandedWeek}
            setExpandedWeek={setExpandedWeek}
            isLoading={isLoading}
            error={error}
            isManager={isManager}
            todayStr={todayStr}
            payrollLockDate={payrollLockDate}
            setCorrectionTarget={setCorrectionTarget}
            setReviewTarget={setReviewTarget}
            setOtApproveTarget={setOtApproveTarget}
          />
        )}

        {/* ── CALENDAR VIEW ── */}
        {viewMode === "calendar" && (
          <AttendanceCalendar
            calendarDays={calendarDays}
            logs={logs}
            weekendDaysStr={weekendDaysStr}
            holidays={holidays}
          />
        )}

        {/* ── Table footer ── */}
        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3
            border-t border-gray-100 dark:border-gray-800
            bg-gray-50/50 dark:bg-gray-900/50">
            <p className="text-gray-400 dark:text-gray-600 text-xs">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
              {" · "}
              <span className="font-mono">{formatMinutes(stats.totalMin)}</span> total payable
              {stats.overtimeMin > 0 && (
                <> · <span className="text-violet-500 dark:text-violet-400 font-mono">
                  {formatMinutes(stats.overtimeMin)}
                </span> overtime</>
              )}
            </p>
            <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-600 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Location verified
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 ml-2" />
              Unverified
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
