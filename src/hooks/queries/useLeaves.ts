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
  revokeLeave, grantLeave, getMyAuditTrail, overrideBalance,
  adminGetAllLeaveTypes, adminCreateLeaveType, adminUpdateLeaveType, adminDeleteLeaveType,
  previewLeave, runManualAccrual,
  getEmployeeBalances, getEmployeeAuditTrail, getEmployeeRequests,
} from '../../api/leaves';
import type {
  LeaveBalanceResponse, LeaveResponse, LeaveTypeDTO,
  LeaveApplyRequest, LeaveActionRequest, LeaveGrantRequest,
  LeaveBalanceAuditResponse, LeaveOverrideRequest, LeavePreviewResponse,
} from '../../types/leave';
import { useState, useEffect } from 'react';

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

export function useAdminLeaveTypes() {
  return useQuery<LeaveTypeDTO[]>({
    queryKey: ['leaves', 'admin', 'types'],
    queryFn: adminGetAllLeaveTypes,
  });
}

// ── Admin-level employee queries (EmployeeEdit) ──────────────────

export function useEmployeeBalances(employeeId: number, enabled = true) {
  return useQuery<LeaveBalanceResponse[]>({
    queryKey: queryKeys.leaves.employeeBalances(employeeId),
    queryFn: () => getEmployeeBalances(employeeId),
    enabled: enabled && employeeId > 0,
  });
}

export function useEmployeeAuditTrail(employeeId: number, enabled = true) {
  return useQuery<LeaveBalanceAuditResponse[]>({
    queryKey: ['leaves', 'admin', 'audit', employeeId],
    queryFn: () => getEmployeeAuditTrail(employeeId),
    enabled: enabled && employeeId > 0,
  });
}

export function useEmployeeLeaveRequests(employeeId: number, enabled = true) {
  return useQuery<LeaveResponse[]>({
    queryKey: ['leaves', 'admin', 'requests', employeeId],
    queryFn: () => getEmployeeRequests(employeeId),
    enabled: enabled && employeeId > 0,
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
  queryClient.invalidateQueries({ queryKey: ['attendance', 'inbox'] });
  // Admin-level caches: EmployeeEdit -> Leaves tab, balance overrides, audit trails
  queryClient.invalidateQueries({ queryKey: ['leaves', 'admin'] });
  // All employee-specific balance caches (hierarchical key match)
  queryClient.invalidateQueries({ queryKey: ['leaves', 'employeeBalances'] });
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

export function useOverrideBalance() {
  return useMutation({
    mutationFn: (data: LeaveOverrideRequest) => overrideBalance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.myBalances() });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.pending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });
}

export function useAdminOverrideBalance() {
  return useMutation({
    mutationFn: (data: LeaveOverrideRequest) => overrideBalance(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.employeeBalances(variables.employeeId) });
      queryClient.invalidateQueries({ queryKey: ['leaves', 'admin', 'audit', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.myBalances() });
    },
  });
}

export function useBulkGrantLeaves() {
  return useMutation({
    mutationFn: (data: { employeeIds: number[]; leaveTypeId: number; amount: number; reason: string }) => {
      return import('../../api/leaves').then(m => m.bulkGrantLeaves(data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
}

// ── Admin Leave Type Mutations ───────────────────────────────────────

export function useCreateLeaveType() {
  return useMutation({
    mutationFn: (data: Partial<LeaveTypeDTO>) => adminCreateLeaveType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves', 'admin', 'types'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.types() });
    },
  });
}

export function useUpdateLeaveType() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<LeaveTypeDTO> }) => 
      adminUpdateLeaveType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves', 'admin', 'types'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.types() });
    },
  });
}

export function useRunAccrual() {
  return useMutation({
    mutationFn: runManualAccrual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.myBalances() });
      queryClient.invalidateQueries({ queryKey: ['leaves', 'admin', 'balances'] });
    },
  });
}

export function useDeleteLeaveType() {
  return useMutation({
    mutationFn: (id: number) => adminDeleteLeaveType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves', 'admin', 'types'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.types() });
    },
  });
}

// ── Debounced Preview Hook ───────────────────────────────────────────

export function useLeavePreview(request: LeaveApplyRequest | null) {
  const [debouncedRequest, setDebouncedRequest] = useState<LeaveApplyRequest | null>(null);

  useEffect(() => {
    if (!request?.startDate || !request?.endDate || !request?.leaveTypeId) {
      setDebouncedRequest(null);
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedRequest(request);
    }, 400); // Architect's requested debounce range (300ms-500ms)

    return () => clearTimeout(handler);
  }, [request?.startDate, request?.endDate, request?.leaveTypeId, request?.halfDay, request?.halfDaySession]);

  return useQuery<LeavePreviewResponse>({
    queryKey: ['leaves', 'preview', debouncedRequest],
    queryFn: () => previewLeave(debouncedRequest!),
    enabled: !!debouncedRequest,
    staleTime: 5000,
  });
}
