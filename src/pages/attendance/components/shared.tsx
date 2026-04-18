// ═══════════════════════════════════════════════════════════════════
//  Shared constants, types, and sub-components for Attendance module
// ═══════════════════════════════════════════════════════════════════
import React, { useEffect, useMemo, useState } from "react";
import { getServerNow } from "../../../utils/serverTime";
import {
  formatMinutes,
  formatTime,
  formatWorkDate,
  type AttendanceLogResponse,
  type AttendanceStatus,
} from "../../../types/attendance";

// ── Status Configuration ──────────────────────────────────────────
export const STATUS_CONFIG: Record<
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

// ── Sub-components ────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, iconBg }: {
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

export function LiveSessionTimer({ startTime }: { startTime: string }) {
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

export function SkeletonRow() {
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

// ── Helper Functions ──────────────────────────────────────────────
export function getMonthOptions() {
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

export function generateCalendarGrid(yearMonth: string) {
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

export function exportToCSV(rows: AttendanceLogResponse[], filename: string) {
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
