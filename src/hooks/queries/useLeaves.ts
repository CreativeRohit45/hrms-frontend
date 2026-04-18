// ═══════════════════════════════════════════════════════════════════
//  useLeaves — Custom hooks for the Leave Management module.
//  Queries: fetching balances, requests, pending approvals, types.
//  Mutations: apply, cancel, approve, reject, revoke, grant — each
//  with cross-domain cache invalidation to prevent stale UI states.
// ═══════════════════════════════════════════════════════════════════

import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { queryClient } from '../../lib/queryClient';
import {
  getMyBalances, getMyLeaves, getLeaveTypes, getPendingLeaves,
  applyForLeave, cancelLeave, approveLeave, rejectLeave,
  revokeLeave, grantLeave, getMyAuditTrail,
} from '../../api/leaves';
import type {
  LeaveBalanceResponse, LeaveResponse, LeaveTypeDTO,
  LeaveApplyRequest, LeaveActionRequest, LeaveGrantRequest,
  LeaveBalanceAuditResponse,
} from '../../types/leave';

// ── Queries ──────────────────────────────────────────────────────

export function useMyBalances() {
  return useQuery<LeaveBalanceResponse[]>({
    queryKey: queryKeys.leaves.myBalances(),
    queryFn: getMyBalances,
  });
}

export function useMyLeaves() {
  return useQuery<LeaveResponse[]>({
    queryKey: queryKeys.leaves.myRequests(),
    queryFn: getMyLeaves,
  });
}

export function useLeaveTypes() {
  return useQuery<LeaveTypeDTO[]>({
    queryKey: queryKeys.leaves.types(),
    queryFn: getLeaveTypes,
    // Leave types rarely change — cache for 10 minutes
    staleTime: 10 * 60_000,
  });
}

export function usePendingLeaves(enabled: boolean) {
  return useQuery<LeaveResponse[]>({
    queryKey: queryKeys.leaves.pending(),
    queryFn: getPendingLeaves,
    enabled,
  });
}

export function useMyAuditTrail(leaveTypeId?: number, year?: number) {
  return useQuery<LeaveBalanceAuditResponse[]>({
    queryKey: queryKeys.leaves.auditTrail(leaveTypeId, year),
    queryFn: () => getMyAuditTrail(leaveTypeId, year),
  });
}

// ── Cross-domain invalidation helper ─────────────────────────────
// When a leave action succeeds, multiple caches across the app need
// to be marked stale. This helper centralizes that logic.

function invalidateLeaveEcosystem() {
  queryClient.invalidateQueries({ queryKey: queryKeys.leaves.myRequests() });
  queryClient.invalidateQueries({ queryKey: queryKeys.leaves.myBalances() });
  queryClient.invalidateQueries({ queryKey: queryKeys.leaves.pending() });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
  // Attendance calendars may show "ON_LEAVE" badges
  queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all() });
}

// ── Mutations ────────────────────────────────────────────────────

export function useApplyLeave() {
  return useMutation({
    mutationFn: (data: LeaveApplyRequest) => applyForLeave(data),
    onSuccess: () => {
      invalidateLeaveEcosystem();
    },
  });
}

export function useCancelLeave() {
  return useMutation({
    mutationFn: (leaveId: number) => cancelLeave(leaveId),
    onSuccess: () => {
      invalidateLeaveEcosystem();
    },
  });
}

export function useApproveLeave() {
  return useMutation({
    mutationFn: (leaveId: number) => approveLeave(leaveId),
    onSuccess: () => {
      invalidateLeaveEcosystem();
    },
  });
}

export function useRejectLeave() {
  return useMutation({
    mutationFn: ({ leaveId, data }: { leaveId: number; data: LeaveActionRequest }) =>
      rejectLeave(leaveId, data),
    onSuccess: () => {
      invalidateLeaveEcosystem();
    },
  });
}

export function useRevokeLeave() {
  return useMutation({
    mutationFn: ({ leaveId, reason }: { leaveId: number; reason: string }) =>
      revokeLeave(leaveId, reason),
    onSuccess: () => {
      invalidateLeaveEcosystem();
    },
  });
}

export function useGrantLeave() {
  return useMutation({
    mutationFn: (data: LeaveGrantRequest) => grantLeave(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.myBalances() });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.pending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });
}
