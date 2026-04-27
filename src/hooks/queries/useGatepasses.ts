// ═══════════════════════════════════════════════════════════════════
//  useGatepasses — Custom hooks for the Gatepass module.
//  Queries: my gatepasses, pending approvals.
//  Mutations: apply, approve, reject, cancel, markExit, markEntry.
//  Cross-domain invalidation: attendance (gatepasses affect payable
//  minutes) and dashboard (badge counts).
// ═══════════════════════════════════════════════════════════════════

import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { queryClient } from '../../lib/queryClient';
import {
  getMyGatepasses,
  getPendingGatepasses,
  applyGatepass,
  approveGatepass,
  rejectGatepass,
  cancelGatepass,
  markExit,
  markEntry,
} from '../../api/gatepass';
import type { GatepassResponse, GatepassApplyRequest, GatepassActionRequest } from '../../types/gatepass';

// ── Queries ──────────────────────────────────────────────────────

export function useMyGatepasses() {
  return useQuery<GatepassResponse[]>({
    queryKey: queryKeys.gatepasses.myRequests(),
    queryFn: getMyGatepasses,
  });
}

export function usePendingGatepasses(enabled: boolean) {
  return useQuery<GatepassResponse[]>({
    queryKey: queryKeys.gatepasses.pending(),
    queryFn: getPendingGatepasses,
    enabled,
  });
}

// ── Cross-domain invalidation helper ─────────────────────────────

function invalidateGatepassEcosystem() {
  queryClient.invalidateQueries({ queryKey: queryKeys.gatepasses.myRequests() });
  queryClient.invalidateQueries({ queryKey: queryKeys.gatepasses.pending() });
  // Gatepasses affect attendance payable minutes (personal deduction)
  queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all() });
  // Dashboard badge counts
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
  queryClient.invalidateQueries({ queryKey: ['attendance', 'inbox'] });
}

// ── Mutations ────────────────────────────────────────────────────

export function useApplyGatepass() {
  return useMutation({
    mutationFn: (data: GatepassApplyRequest) => applyGatepass(data),
    onSuccess: () => {
      invalidateGatepassEcosystem();
    },
  });
}

export function useApproveGatepass() {
  return useMutation({
    mutationFn: (id: number) => approveGatepass(id),
    onSuccess: () => {
      invalidateGatepassEcosystem();
    },
  });
}

export function useRejectGatepass() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: GatepassActionRequest }) =>
      rejectGatepass(id, data),
    onSuccess: () => {
      invalidateGatepassEcosystem();
    },
  });
}

export function useCancelGatepass() {
  return useMutation({
    mutationFn: (id: number) => cancelGatepass(id),
    onSuccess: () => {
      invalidateGatepassEcosystem();
    },
  });
}

export function useMarkExit() {
  return useMutation({
    mutationFn: (id: number) => markExit(id),
    onSuccess: () => {
      invalidateGatepassEcosystem();
    },
  });
}

export function useMarkEntry() {
  return useMutation({
    mutationFn: (id: number) => markEntry(id),
    onSuccess: () => {
      invalidateGatepassEcosystem();
    },
  });
}
