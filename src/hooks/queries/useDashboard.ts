// ═══════════════════════════════════════════════════════════════════
//  useDashboard — Custom hook abstracting Dashboard data fetching.
//  The UI component just calls useDashboard() and gets typed data.
// ═══════════════════════════════════════════════════════════════════

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { getDashboardStats, type DashboardStats } from '../../api/dashboard';
import { getDepartmentAbsentees } from '../../api/leaves';
import type { DepartmentAbsenteeDTO } from '../../types/leave';

/**
 * Fetches the main dashboard statistics (attendance, leave balances, session).
 * staleTime inherited from global default (60s).
 */
export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: queryKeys.dashboard(),
    queryFn: getDashboardStats,
  });
}

/**
 * Fetches department absentee data for the "Team on Leave" card.
 * Uses the same default staleTime — team availability rarely changes
 * within a 1-minute window.
 */
export function useDepartmentAbsentees() {
  return useQuery<DepartmentAbsenteeDTO[]>({
    queryKey: queryKeys.leaves.deptAbsentees(),
    queryFn: getDepartmentAbsentees,
  });
}
