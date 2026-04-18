// src/types/attendance.ts
// Mirrors AttendanceLogResponse.java exactly

export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "HALF_DAY"
  | "LATE"
  | "ON_LEAVE"
  | "HOLIDAY"
  | "WEEKEND_WORK"
  | "HOLIDAY_WORK";

export type CorrectionStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export interface AttendanceLogResponse {
  id: number;
  employeeId: number;
  employeeCode: string;
  fullName: string;
  workDate: string;
  punchInTime: string | null;
  punchOutTime: string | null;
  locationVerifiedIn: boolean;
  locationVerifiedOut: boolean | null;
  calculatedPayableMinutes: number | null;
  overtime: boolean;
  overtimeMinutes: number;
  attendanceStatus: AttendanceStatus;
  manuallyCorrected: boolean;
  correctionReason: string | null;
  correctionStatus: CorrectionStatus;
  requestedPunchInTime: string | null;
  requestedPunchOutTime: string | null;
  isOvertimeApproved: boolean | null;
  shiftStartTime: string;
  shiftEndTime: string;
}

export function formatMinutes(minutes: number | null): string {
  if (minutes === null) return "--";
  if (minutes === 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

export function formatTime(iso: string | null): string {
  if (!iso) return "--";

  if (iso.length <= 8 && iso.includes(":")) {
    const [hourString, minuteString] = iso.split(":");
    const hours = Number(hourString);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${String(hours12).padStart(2, "0")}:${minuteString.padStart(2, "0")} ${period}`;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

export function formatWorkDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatLongDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
