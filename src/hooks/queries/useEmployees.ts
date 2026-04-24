// ═══════════════════════════════════════════════════════════════════
//  useEmployees — Custom hooks for Employee Directory module.
//  Queries: list all, get by id.
//  Mutations: create, update, delete.
// ═══════════════════════════════════════════════════════════════════

import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { queryClient } from '../../lib/queryClient';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getMyProfile,
  updateMyProfile,
  changePassword,
} from '../../api/employees';
import type { EmployeeResponse, EmployeeCreateRequest, EmployeeUpdateRequest } from '../../types/employee';
import type { PageResponse } from '../../types/common';

// ── Queries ──────────────────────────────────────────────────────

export function useAllEmployees(page = 0, size = 50) {
  return useQuery<PageResponse<EmployeeResponse>>({
    queryKey: [...queryKeys.employees.all(), page, size],
    queryFn: () => getEmployees(page, size),
  });
}

export function useEmployeeById(id: number, enabled = true) {
  return useQuery<EmployeeResponse>({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => getEmployeeById(id),
    enabled: enabled && id > 0,
  });
}

export function useMyProfile() {
  return useQuery<EmployeeResponse>({
    queryKey: ['myProfile'],
    queryFn: getMyProfile,
  });
}

// ── Mutations ────────────────────────────────────────────────────

export function useCreateEmployee() {
  return useMutation({
    mutationFn: (data: EmployeeCreateRequest) => createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all() });
    },
  });
}

export function useUpdateEmployee() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmployeeUpdateRequest }) =>
      updateEmployee(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(variables.id) });
    },
  });
}

export function useDeleteEmployee() {
  return useMutation({
    mutationFn: (id: number) => deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all() });
    },
  });
}

export function useUpdateMyProfile() {
  return useMutation({
    mutationFn: (data: { phone?: string; email?: string; photoUrl?: string }) =>
      updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => changePassword(data),
  });
}

