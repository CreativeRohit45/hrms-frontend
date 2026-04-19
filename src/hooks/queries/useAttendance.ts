// ═══════════════════════════════════════════════════════════════════
//  useAttendance — Custom hooks for the Attendance module.
//  Queries: my logs, employee logs, daily roster.
//  Mutations: correction request, approve/reject correction, overtime.
// ═══════════════════════════════════════════════════════════════════

import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { queryClient } from '../../lib/queryClient';
import {
  getMyAttendanceLogs, getEmployeeLogs, getDailyAttendanceLogs,
  requestCorrection, approveCorrection, rejectCorrection, approveOvertime,
  getUnifiedInbox,
} from '../../api/attendance';
import { getDashboardStats, getEmployeeDashboardStats } from '../../api/dashboard';
import type { AttendanceLogResponse } from '../../types/attendance';

// ── Queries ──────────────────────────────────────────────────────

export function useMyAttendanceLogs() {
  return useQuery<AttendanceLogResponse[]>({
    queryKey: queryKeys.attendance.myLogs('me'),
    queryFn: () => getMyAttendanceLogs(),
  });
}

export function useEmployeeLogs(employeeCode: string, enabled: boolean) {
  return useQuery<AttendanceLogResponse[]>({
    queryKey: queryKeys.attendance.employeeLogs(employeeCode),
    queryFn: () => getEmployeeLogs(employeeCode),
    enabled: enabled && employeeCode !== 'me',
  });
}

export function useDailyRosterLogs(date: string, enabled: boolean) {
  return useQuery<AttendanceLogResponse[]>({
    queryKey: queryKeys.attendance.roster(date),
    queryFn: () => getDailyAttendanceLogs(date),
    enabled,
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

export function useUnifiedInbox() {
  return useInfiniteQuery({
    queryKey: ['attendance', 'inbox'],
    queryFn: ({ pageParam = 0 }) => getUnifiedInbox(pageParam, 20),
    getNextPageParam: (lastPage) => {
      const next = lastPage.number + 1;
      return next < lastPage.totalPages ? next : undefined;
    },
    initialPageParam: 0,
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
