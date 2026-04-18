import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { RefreshCw, ChevronDown, ChevronRight, Calendar, List } from "lucide-react";
import { getServerNow } from "../../utils/serverTime";
import {
  getMyAttendanceLogs,
  getEmployeeLogs,
  getDailyAttendanceLogs,
  requestCorrection as submitCorrectionRequest,
  approveCorrection,
  rejectCorrection,
  approveOvertime,
} from "../../api/attendance";
import {
  formatMinutes,
  formatTime,
  formatWorkDate,
  formatLongDate,
  type AttendanceLogResponse,
  type AttendanceStatus,
} from "../../types/attendance";
import { getDashboardStats, getEmployeeDashboardStats } from "../../api/dashboard";
import type { EmployeeResponse } from "../../types/employee";
import { useAuth } from "../../context/AuthContext";
import { getEmployees } from "../../api/employees";
import { TimePickerField, parseTimeToParts } from "../../components/ui/TimePickerField";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { useAppToast } from "../../components/ui/ToastProvider";

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; dot: string; badge: string }
> = {
  PRESENT: { label: "Present", dot: "bg-emerald-500", badge: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800" },
  LATE: { label: "Late", dot: "bg-amber-500", badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800" },
  ABSENT: { label: "Absent", dot: "bg-red-500", badge: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800" },
  HALF_DAY: { label: "Half Day", dot: "bg-orange-400", badge: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 shadow-sm" },
  ON_LEAVE: { label: "On Leave", dot: "bg-sky-500", badge: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-sky-800" },
  HOLIDAY: { label: "Holiday", dot: "bg-violet-500", badge: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-800" },
  WEEKEND_WORK: { label: "Weekend Work", dot: "bg-indigo-500", badge: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800" },
  HOLIDAY_WORK: { label: "Holiday Work", dot: "bg-fuchsia-500", badge: "bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-400 border border-fuchsia-100 dark:border-fuchsia-800" },
};



// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, iconBg }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; iconBg: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm hover:translate-y-[-2px] transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest truncate">{label}</p>
          <p className="text-gray-900 dark:text-gray-100 text-2xl font-black mt-1 leading-none">{value}</p>
          {sub && <p className="text-gray-400 dark:text-gray-500 text-[10px] italic font-medium mt-1.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border dark:border-none ${iconBg}`}>{icon}</div>
      </div>
    </div>
  );
}

function LiveSessionTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const update = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setElapsed(`${h}h ${m}m ${s}s`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  return (
    <span className="text-amber-500 dark:text-amber-400 text-xs font-mono font-bold flex items-center gap-1.5 tracking-tight">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
      {elapsed}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-800">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" style={{ width: `${60 + (i % 3) * 20}%` }} />
        </td>
      ))}
    </tr>
  );
}

function getMonthOptions() {
  const options = [];
  const now = getServerNow();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    });
  }
  return options;
}

function generateCalendarGrid(yearMonth: string) {
  const [yearStr, monthStr] = yearMonth.split("-");
  const year = parseInt(yearStr);
  const month = parseInt(monthStr) - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const grid: (string | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) grid.push(null);
  for (let i = 1; i <= daysInMonth; i++) {
    grid.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`);
  }
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

// ── Feature 3: CSV Export helper ──────────────────────────────────────────────
function exportToCSV(rows: AttendanceLogResponse[], filename: string) {
  const headers = [
    "Date", "Employee Code", "Full Name",
    "Punch In", "Punch Out",
    "Payable Minutes", "Overtime Minutes", "Status",
    "Location Verified In", "Location Verified Out",
    "Manually Corrected", "Correction Status", "Correction Reason",
    "Overtime Approved",
  ];

  const escape = (v: unknown): string => {
    const s = v == null ? "" : String(v);
    // Wrap in quotes if it contains comma, newline, or quote
    return s.includes(",") || s.includes("\n") || s.includes('"')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const csvRows = rows.map((log) => [
    log.workDate,
    log.employeeCode,
    log.fullName,
    log.punchInTime ? log.punchInTime.replace("T", " ") : "",
    log.punchOutTime ? log.punchOutTime.replace("T", " ") : "",
    log.calculatedPayableMinutes ?? "",
    log.overtimeMinutes,
    log.attendanceStatus,
    log.locationVerifiedIn ? "Yes" : "No",
    log.locationVerifiedOut == null ? "" : log.locationVerifiedOut ? "Yes" : "No",
    log.manuallyCorrected ? "Yes" : "No",
    log.correctionStatus ?? "NONE",
    log.correctionReason ?? "",
    log.isOvertimeApproved == null ? "" : log.isOvertimeApproved ? "Yes" : "No",
  ].map(escape).join(","));

  const blob = new Blob(
    [[headers.join(","), ...csvRows].join("\n")],
    { type: "text/csv;charset=utf-8;" }
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Correction Request Modal ──────────────────────────────────────────────────
interface CorrectionModalProps {
  log: AttendanceLogResponse;
  onClose: () => void;
  onSuccess: (updated: AttendanceLogResponse) => void;
}

// TimePickerField and DatePickerField have been moved to components/ui

function CorrectionModal({ log, onClose, onSuccess }: CorrectionModalProps) {
  const [inTime, setInTime] = useState(parseTimeToParts(log.punchInTime));
  const [outTime, setOutTime] = useState(parseTimeToParts(log.punchOutTime));
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Create a Date in local browser time for the worker's work date
      const d = new Date(`${log.workDate}T00:00:00`);
      d.setHours(h24, parseInt(m), 0);
      if (offsetDay !== 0) d.setDate(d.getDate() + offsetDay);

      // Format as YYYY-MM-DDTHH:mm:ss (Local Time) to match backend's LocalDateTime
      const Y = d.getFullYear();
      const M = String(d.getMonth() + 1).padStart(2, "0");
      const D = String(d.getDate()).padStart(2, "0");
      const HH = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${Y}-${M}-${D}T${HH}:${mm}:00`;
    };

    // Auto-detect overnight shift: if Punch In is PM and Punch Out is AM
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

    setLoading(true);
    setError(null);
    try {
      const updated = await submitCorrectionRequest(log.id, punchInISO, punchOutISO, reason.trim());
      onSuccess(updated);
    } catch (err: unknown) {
      setError("Failed to submit. Please check your data.");
    } finally {
      setLoading(false);
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
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white
              text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Feature 1: Correction review modal (Manager/Admin only) ──────────────────
interface CorrectionReviewModalProps {
  log: AttendanceLogResponse;
  onClose: () => void;
  onSuccess: (updated: AttendanceLogResponse) => void;
}

function CorrectionReviewModal({ log, onClose, onSuccess }: CorrectionReviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await approveCorrection(log.id);
      onSuccess(updated);
    } catch (err: unknown) {
      setError("Failed to approve. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for rejection.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await rejectCorrection(log.id, reason.trim());
      onSuccess(updated);
    } catch (err: unknown) {
      setError("Failed to reject. Please try again.");
    } finally {
      setLoading(false);
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
          {/* Comparison table */}
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

          <button
            onClick={onClose}
            className="text-sm font-semibold text-gray-500 hover:text-gray-700"
          >
            Close
          </button>

          <div className="flex gap-2">
            {!rejectMode ? (
              <>
                <button
                  onClick={() => setRejectMode(true)}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                >
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  {loading ? "..." : "Approve Request"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setRejectMode(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500"
                >
                  Back
                </button>
                <button
                  onClick={handleReject}
                  disabled={!reason.trim() || loading}
                  className="px-6 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg"
                >
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


// ── Main page component ───────────────────────────────────────────────────────
export default function AttendancePage() {
  const { user, payrollLockDate } = useAuth();
  const { pushToast } = useAppToast();
  const isManager = user?.role === "SUPER_ADMIN"
    || user?.role === "HR_ADMIN"
    || user?.role === "DEPARTMENT_MANAGER";

  const location = useLocation();

  const [activeEmployeeCode, setActiveEmployeeCode] = useState<string>("me");
  const [searchInput, setSearchInput] = useState<string>("");
  const [employeeList, setEmployeeList] = useState<EmployeeResponse[]>([]);

  const [logs, setLogs] = useState<AttendanceLogResponse[]>([]);
  const [dailyLogs, setDailyLogs] = useState<AttendanceLogResponse[]>([]);
  const [rosterSearchTerm, setRosterSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const lastAutoMonth = useRef("");

  const getLocalTodayStr = () => {
    const d = getServerNow();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const todayStr = getLocalTodayStr();

  const [rosterDate, setRosterDate] = useState<string>(todayStr);
  const [otApproveTarget, setOtApproveTarget] = useState<AttendanceLogResponse | null>(null);
  const [approvingOT, setApprovingOT] = useState(false);
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

  const [weekendDaysStr, setWeekendDaysStr] = useState<string>("Saturday,Sunday");
  const [holidays, setHolidays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const d = getServerNow();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"calendar" | "list" | "roster">(() => {
    return location.pathname === "/app/roster" ? "roster" : "calendar";
  });

  useEffect(() => {
    if (location.pathname === "/app/roster") {
      setViewMode("roster");
    } else if (viewMode === "roster") {
      setViewMode("calendar");
    }
  }, [location.pathname]);

  // Feature 1: correction modal state
  const [correctionTarget, setCorrectionTarget] =
    useState<AttendanceLogResponse | null>(null);
  const [reviewTarget, setReviewTarget] =
    useState<AttendanceLogResponse | null>(null);

  const monthOptions = useMemo(getMonthOptions, []);
  const pickerDays = useMemo(() => generateCalendarGrid(pickerMonth), [pickerMonth]);

  // Weekly grouping state for mobile
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (viewMode === "roster") {
        const dLogs = await getDailyAttendanceLogs(rosterDate);
        setDailyLogs(dLogs);
      } else {
        let data: AttendanceLogResponse[];
        let dashboardStats: { weekendDays?: string; allHolidays?: string[] };

        if (activeEmployeeCode === "me") {
          [data, dashboardStats] = await Promise.all([
            getMyAttendanceLogs(),
            getDashboardStats(),
          ]);
        } else {
          try {
            [data, dashboardStats] = await Promise.all([
              getEmployeeLogs(activeEmployeeCode),
              getEmployeeDashboardStats(activeEmployeeCode),
            ]);
          } catch (err: unknown) {
            if ((err as { response?: { status: number } })?.response?.status === 404) {
              setError("Employee code not found.");
              return;
            }
            throw err;
          }
        }

        if (dashboardStats.weekendDays) setWeekendDaysStr(dashboardStats.weekendDays);
        if (dashboardStats.allHolidays) setHolidays(dashboardStats.allHolidays);

        data.sort((a, b) => b.workDate.localeCompare(a.workDate));
        setLogs(data);
      }
    } catch {
      setError("Unable to load attendance records. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [activeEmployeeCode, viewMode, rosterDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    if (isManager) getEmployees().then(setEmployeeList).catch(() => { });
  }, [isManager]);

  // ── Helpers: update a single log in local state without full refetch ───────
  const updateLogInState = (updated: AttendanceLogResponse) => {
    setLogs((prev) => prev.map((l) => l.id === updated.id ? updated : l));
    setDailyLogs((prev) => prev.map((l) => l.id === updated.id ? updated : l));
  };

  const handleApproveOvertime = async () => {
    if (!otApproveTarget) return;
    setApprovingOT(true);
    try {
      const updated = await approveOvertime(otApproveTarget.id);
      updateLogInState(updated);
      setOtApproveTarget(null);
    } catch (err: any) {
      pushToast({
        tone: "error",
        title: "Overtime approval failed",
        message: err?.message || "Please try again.",
      });
    } finally {
      setApprovingOT(false);
    }
  };

  const filtered = useMemo(
    () => logs.filter((log) => {
      const matchesMonth = log.workDate.startsWith(filterMonth);
      const matchesStatus = statusFilter === "ALL" || log.attendanceStatus === statusFilter;
      return matchesMonth && matchesStatus;
    }),
    [logs, filterMonth, statusFilter]
  );

  // ── Weekly Grouping for Mobile ──────────────────────────────────────────────
  const groupedWeeks = useMemo(() => {
    if (!filtered || filtered.length === 0) return [];

    // Group records by calendar week (Monday as start)
    const weeksMap = new Map<string, AttendanceLogResponse[]>();

    filtered.forEach(log => {
      const date = new Date(log.workDate);
      const day = date.getDay(); // 0 is Sun, 1 is Mon
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
      const monday = new Date(date);
      monday.setDate(diff);
      const weekKey = monday.toISOString().split('T')[0];

      if (!weeksMap.has(weekKey)) weeksMap.set(weekKey, []);
      weeksMap.get(weekKey)!.push(log);
    });

    // Convert map to sorted array of weeks
    const sortedWeekKeys = Array.from(weeksMap.keys()).sort((a, b) => b.localeCompare(a));
    return sortedWeekKeys.map((key, index) => {
      const logs = weeksMap.get(key)!.sort((a, b) => b.workDate.localeCompare(a.workDate));
      return {
        id: key,
        label: `Week ${sortedWeekKeys.length - index}`,
        dateRange: `${formatWorkDate(logs[logs.length - 1].workDate)} - ${formatWorkDate(logs[0].workDate)}`,
        logs
      };
    });
  }, [filtered]);

  // Default expand the first (latest) week only on month change or first load
  useEffect(() => {
    if (groupedWeeks.length > 0 && lastAutoMonth.current !== filterMonth) {
      setExpandedWeek(groupedWeeks[0].id);
      lastAutoMonth.current = filterMonth;
    }
  }, [groupedWeeks, filterMonth]);

  // ── Aggregate stats ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Selected employee object for header display
  const selectedEmployee = useMemo(() => {
    if (activeEmployeeCode === "me") return null;
    return employeeList.find(e => e.employeeCode === activeEmployeeCode);
  }, [activeEmployeeCode, employeeList]);

  // Filtered suggestions for autocomplete
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
          // Robust parsing: extract YYYY-MM-DD from punchInTime and combine with HH:mm from shiftStartTime
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
      const weekendArray = weekendDaysStr.split(",").map((s) => s.trim().toLowerCase());
      for (let i = 1; i <= daysToConsider; i++) {
        const d = new Date(yr, mo - 1, i);
        const dateStr = `${yr}-${String(mo).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
        const isWeekend = weekendArray.includes(dayNames[d.getDay()].toLowerCase());
        const isHoliday = holidays.includes(dateStr);
        const isToday = dateStr === todayStr;

        if (!isWeekend && !isHoliday && !isToday) {
          // Check if any log exists for this date with a "Present" style status
          // Note: ABSENT logs are NOT counted as "covering" the day
          const hasValidRecord = filtered.some((l) =>
            l.workDate === dateStr &&
            ["PRESENT", "LATE", "WEEKEND_WORK", "HOLIDAY_WORK", "ON_LEAVE", "HALF_DAY"].includes(l.attendanceStatus)
          );
          if (!hasValidRecord) {
            absent++;
          }
        }
      }
    }
    return { present, absent, late, totalMin, overtimeMin };
  }, [filtered, filterMonth, weekendDaysStr, todayStr, holidays]);

  const filteredDailyLogs = useMemo(() => {
    if (!rosterSearchTerm.trim()) return dailyLogs;
    const term = rosterSearchTerm.toLowerCase();
    return dailyLogs.filter(
      (l) => l.fullName.toLowerCase().includes(term) || l.employeeCode.toLowerCase().includes(term)
    );
  }, [dailyLogs, rosterSearchTerm]);

  const calendarDays = useMemo(
    () => (filterMonth ? generateCalendarGrid(filterMonth) : []),
    [filterMonth]
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Correction modal ── */}
      {correctionTarget && (
        <CorrectionModal
          log={correctionTarget}
          onClose={() => setCorrectionTarget(null)}
          onSuccess={(updated) => {
            updateLogInState(updated);
            setCorrectionTarget(null);
          }}
        />
      )}

      {/* ── Review Correction modal (Manager only) ── */}
      {reviewTarget && (
        <CorrectionReviewModal
          log={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSuccess={(updated) => {
            updateLogInState(updated);
            setReviewTarget(null);
          }}
        />
      )}

      {/* ── Overtime Approval Modal ── */}
      <ConfirmModal
        isOpen={!!otApproveTarget}
        onClose={() => setOtApproveTarget(null)}
        onConfirm={handleApproveOvertime}
        title="Approve Overtime"
        message={`Confirming +${formatMinutes(otApproveTarget?.overtimeMinutes || 0)} overtime for ${otApproveTarget?.fullName}. This will be added to their payroll.`}
        confirmText={approvingOT ? "Approving..." : "Approve Overtime"}
        isDestructive={false}
      />

      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div className="flex flex-col">
          <h1 className="text-gray-900 dark:text-gray-100 text-xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
            {viewMode === "roster" ? "Daily Roster" : (activeEmployeeCode === "me" ? "My Attendance" : "Employee Records")}
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
          {isManager && viewMode !== "roster" && (
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
            onClick={fetchLogs}
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
          <button onClick={fetchLogs}
            className="text-red-500 dark:text-red-400 text-xs font-semibold
              hover:text-red-700 dark:hover:text-red-200 transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* ── Main card ── */}
      <div className={`bg-white dark:bg-gray-900 border border-gray-200
        dark:border-gray-800 rounded-xl shadow-card relative animate-in fade-in duration-500`}>

        {/* ── Toolbar (list/calendar) ── */}
        {viewMode !== "roster" && (
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
              {/* Desktop Sub-view toggle (Calendar/List) - Moved here to align row */}
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
                {/* Status filter */}
                {viewMode === "list" && (
                  <div className="relative w-full sm:w-auto sm:order-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none w-full bg-gray-50 dark:bg-gray-800
                        border border-gray-200 dark:border-gray-700 rounded-xl
                        text-gray-700 dark:text-gray-300 text-[11px] sm:text-xs font-bold
                        pl-2.5 sm:pl-3 pr-8 sm:pr-10 py-1.5 sm:py-2 outline-none focus:ring-4
                        focus:ring-indigo-500/10 focus:border-indigo-400
                        transition-all cursor-pointer min-w-0 sm:min-w-[130px]"
                    >
                      <option value="ALL">All Status</option>
                      {Object.keys(STATUS_CONFIG).map((s) => (
                        <option key={s} value={s}>{STATUS_CONFIG[s as AttendanceStatus].label}</option>
                      ))}
                    </select>
                    <div className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                )}

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

                {/* Feature 3: CSV Export button (Full width on mobile, auto on desktop) */}
                {viewMode === "list" && filtered.length > 0 && (
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
        )}


        {/* ── ROSTER VIEW ── */}
        {viewMode === "roster" && (
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
                {/* Feature 3: Roster CSV Export */}
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
                        {/* Feature 2: Overtime action menu (admin only) */}
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
        )}

        {/* ── LIST VIEW ── */}
        {(viewMode === "list" || viewMode === "calendar") && (
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

                    // Can the employee request a correction?
                    // Only if: session is complete, and no PENDING correction exists
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

                              {/* Integrated Regularized Indicator */}
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
                              {/* Manual Regularization for Admins */}
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

                        {/* Feature 1: Request Correction button (Employee only) */}
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

            {/* Mobile Attendance Cards (Used for List & Calendar fallback on mobile) */}
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
        )}

        {/* ── CALENDAR VIEW ── */}
        {viewMode === "calendar" && (
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

                const serverNow = getServerNow();
                const calendarTodayStr = `${serverNow.getFullYear()}-${String(serverNow.getMonth() + 1).padStart(2, "0")}-${String(serverNow.getDate()).padStart(2, "0")}`;

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
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold rounded px-1.5 py-0.5 truncate ${dayStatus.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dayStatus.dot}`} />
                          <span className="truncate">{dayStatus.label}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 dark:text-gray-600 font-medium pl-1">
                          {isFuture ? "—" : "No record"}
                        </span>
                      )}
                      {log && (log.punchInTime || log.calculatedPayableMinutes !== null) && (
                        <div className="pr-1">
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
        )}

        {/* ── Table footer ── */}
        {!isLoading && viewMode !== "roster" && filtered.length > 0 && (
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

