// ═══════════════════════════════════════════════════════════════════
//  useAttendance — Custom hooks for the Attendance module.
//  Queries: my logs, employee logs, daily roster.
//  Mutations: correction request, approve/reject correction, overtime.
// ═══════════════════════════════════════════════════════════════════

import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { queryClient } from '../../lib/queryClient';
import {
  getMyAttendanceLogs, getEmployeeLogs, getDailyAttendanceLogs,
  requestCorrection, approveCorrection, rejectCorrection, approveOvertime,
  rejectOvertime, getUnifiedInbox, punchIn, punchOut,
} from '../../api/attendance';
import { getDashboardStats, getEmployeeDashboardStats } from '../../api/dashboard';
import type { AttendanceLogResponse } from '../../types/attendance';

// ── Queries ──────────────────────────────────────────────────────

export function useMyAttendanceLogs(month?: string) {
  return useQuery<AttendanceLogResponse[]>({
    queryKey: month ? [...queryKeys.attendance.myLogs('me'), month] : queryKeys.attendance.myLogs('me'),
    queryFn: () => {
      if (month) {
        const [year, mo] = month.split('-').map(Number);
        const startDate = `${year}-${String(mo).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(mo).padStart(2, '0')}-${new Date(year, mo, 0).getDate()}`;
        return getMyAttendanceLogs(undefined, startDate, endDate);
      }
      return getMyAttendanceLogs();
    },
    placeholderData: keepPreviousData,
  });
}

export function useEmployeeLogs(employeeCode: string, enabled: boolean, month?: string) {
  return useQuery<AttendanceLogResponse[]>({
    queryKey: month ? [...queryKeys.attendance.employeeLogs(employeeCode), month] : queryKeys.attendance.employeeLogs(employeeCode),
    queryFn: () => {
      return getEmployeeLogs(employeeCode);
    },
    enabled: enabled && employeeCode !== 'me',
    placeholderData: keepPreviousData,
  });
}

export function useDailyRosterLogs(
  date: string,
  page = 0,
  size = 50,
  shiftId?: number | string,
  departmentId?: number | string,
  status?: string,
  enabled = true
) {
  return useQuery({
    queryKey: [...queryKeys.attendance.roster(date), page, size, shiftId, departmentId, status],
    queryFn: () => getDailyAttendanceLogs(date, page, size, shiftId, departmentId, status),
    enabled: enabled && !!date,
  });
}

export function useAttendanceDashboardStats(employeeCode: string) {
  return useQuery<any>({
    queryKey: queryKeys.attendance.dashboardStats(employeeCode),
    queryFn: () =>
      employeeCode === 'me'
        ? getDashboardStats()
        : getEmployeeDashboardStats(employeeCode),
  });
}

export function useUnifiedInbox(status?: string, requestType?: string, departmentId?: number, page = 0) {
  return useQuery({
    queryKey: ['attendance', 'inbox', status, requestType, departmentId, page],
    queryFn: () => getUnifiedInbox(page, 10, status, requestType, departmentId),
    placeholderData: keepPreviousData,
  });
}

// ── Cross-domain invalidation helper ─────────────────────────────

function invalidateAttendanceEcosystem(employeeCode: string) {
  // Invalidate the specific employee's logs
  if (employeeCode === 'me') {
    queryClient.invalidateQueries({ queryKey: queryKeys.attendance.myLogs('me') });
  } else {
    queryClient.invalidateQueries({ queryKey: queryKeys.attendance.employeeLogs(employeeCode) });
  }
  // Roster may also be affected
  queryClient.invalidateQueries({ queryKey: ['attendance', 'roster'] });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
  queryClient.invalidateQueries({ queryKey: queryKeys.attendance.dashboardStats(employeeCode) });
  // Unified Inbox invalidation
  queryClient.invalidateQueries({ queryKey: ['attendance', 'inbox'] });
  // Pending corrections queue (manager sidebar badge)
  queryClient.invalidateQueries({ queryKey: queryKeys.attendance.pendingCorrections() });
  // Cross-domain: admin employee request views in EmployeeEdit
  queryClient.invalidateQueries({ queryKey: ['leaves', 'admin', 'requests'] });
}

// ── Punch Mutations ──────────────────────────────────────────────

export function usePunchIn() {
  return useMutation({
    mutationFn: ({ lat, lng }: { lat: number; lng: number }) =>
      punchIn(lat, lng),
    onSuccess: () => {
      invalidateAttendanceEcosystem('me');
    },
  });
}

export function usePunchOut() {
  return useMutation({
    mutationFn: ({ lat, lng }: { lat: number; lng: number }) =>
      punchOut(lat, lng),
    onSuccess: () => {
      invalidateAttendanceEcosystem('me');
    },
  });
}

// ── Mutations ────────────────────────────────────────────────────

export function useRequestCorrection(employeeCode: string) {
  return useMutation({
    mutationFn: ({
      logId, punchIn, punchOut, reason,
    }: {
      logId: number; punchIn: string; punchOut: string; reason: string;
    }) => requestCorrection(logId, punchIn, punchOut, reason),
    onSuccess: () => {
      invalidateAttendanceEcosystem(employeeCode);
    },
  });
}

export function useApproveCorrection(employeeCode?: string) {
  return useMutation({
    mutationFn: (logId: number) => approveCorrection(logId),
    onSuccess: () => {
      invalidateAttendanceEcosystem(employeeCode || 'me');
    },
  });
}

export function useRejectCorrection(employeeCode?: string) {
  return useMutation({
    mutationFn: ({ logId, reason }: { logId: number; reason: string }) =>
      rejectCorrection(logId, reason),
    onSuccess: () => {
      invalidateAttendanceEcosystem(employeeCode || 'me');
    },
  });
}

export function useApproveOvertimeMutation(employeeCode: string) {
  return useMutation({
    mutationFn: (logId: number) => approveOvertime(logId),
    onSuccess: () => {
      invalidateAttendanceEcosystem(employeeCode);
    },
  });
}

export function useRejectOvertimeMutation(employeeCode: string) {
  return useMutation({
    mutationFn: (logId: number) => rejectOvertime(logId),
    onSuccess: () => {
      invalidateAttendanceEcosystem(employeeCode);
    },
  });
}
