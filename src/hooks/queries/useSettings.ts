// src/hooks/queries/useSettings.ts

import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import {
  getShifts, createShift, updateShift, deleteShift, type Shift,
  getHolidays, createHoliday, updateHoliday, deleteHoliday, type Holiday,
  getLocations, createLocation, updateLocation, type CompanyLocation,
  getDepartments, createDepartment, updateDepartment, deleteDepartment, type Department,
  getLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType, type LeaveType
} from '../../api/settings';

const settingsKeys = {
  all: ['settings'] as const,
  shifts: () => [...settingsKeys.all, 'shifts'] as const,
  holidays: () => [...settingsKeys.all, 'holidays'] as const,
  locations: () => [...settingsKeys.all, 'locations'] as const,
  departments: () => [...settingsKeys.all, 'departments'] as const,
  leaveTypes: () => [...settingsKeys.all, 'leaveTypes'] as const,
};

// ── Shifts ────────────────────────────────────────────────────────────────────

export function useShifts() {
  return useQuery<Shift[]>({
    queryKey: settingsKeys.shifts(),
    queryFn: getShifts,
  });
}

export function useCreateShift() {
  return useMutation({
    mutationFn: (shift: Shift) => createShift(shift),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.shifts() }),
  });
}

export function useUpdateShift() {
  return useMutation({
    mutationFn: ({ id, shift }: { id: number; shift: Shift }) => updateShift(id, shift),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.shifts() }),
  });
}

export function useDeleteShift() {
  return useMutation({
    mutationFn: (id: number) => deleteShift(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.shifts() }),
  });
}

// ── Leave Types ───────────────────────────────────────────────────────────────

export function useLeaveTypes() {
  return useQuery<LeaveType[]>({
    queryKey: settingsKeys.leaveTypes(),
    queryFn: getLeaveTypes,
  });
}

export function useCreateLeaveType() {
  return useMutation({
    mutationFn: (lt: LeaveType) => createLeaveType(lt),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.leaveTypes() }),
  });
}

export function useUpdateLeaveType() {
  return useMutation({
    mutationFn: ({ id, lt }: { id: number; lt: LeaveType }) => updateLeaveType(id, lt),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.leaveTypes() }),
  });
}

export function useDeleteLeaveType() {
  return useMutation({
    mutationFn: (id: number) => deleteLeaveType(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.leaveTypes() }),
  });
}

// ── Holidays ──────────────────────────────────────────────────────────────────

export function useHolidays() {
  return useQuery<Holiday[]>({
    queryKey: settingsKeys.holidays(),
    queryFn: getHolidays,
  });
}

export function useCreateHoliday() {
  return useMutation({
    mutationFn: (holiday: Holiday) => createHoliday(holiday),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.holidays() }),
  });
}

export function useUpdateHoliday() {
  return useMutation({
    mutationFn: ({ id, holiday }: { id: number; holiday: Holiday }) => updateHoliday(id, holiday),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.holidays() }),
  });
}

export function useDeleteHoliday() {
  return useMutation({
    mutationFn: (id: number) => deleteHoliday(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.holidays() }),
  });
}

// ── Company Locations ─────────────────────────────────────────────────────────

export function useCompanyLocation() {
  return useQuery<CompanyLocation[]>({
    queryKey: settingsKeys.locations(),
    queryFn: getLocations,
  });
}

export function useCreateLocation() {
  return useMutation({
    mutationFn: (loc: CompanyLocation) => createLocation(loc),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.locations() }),
  });
}

export function useUpdateLocation() {
  return useMutation({
    mutationFn: ({ id, loc }: { id: number; loc: CompanyLocation }) => updateLocation(id, loc),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.locations() }),
  });
}

// ── Departments ───────────────────────────────────────────────────────────────

export function useDepartments(enabled = true) {
  return useQuery<Department[]>({
    queryKey: settingsKeys.departments(),
    queryFn: getDepartments,
    enabled,
  });
}

export function useCreateDepartment() {
  return useMutation({
    mutationFn: (dept: Department) => createDepartment(dept),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.departments() }),
  });
}

export function useUpdateDepartment() {
  return useMutation({
    mutationFn: ({ id, dept }: { id: number; dept: Department }) => updateDepartment(id, dept),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.departments() }),
  });
}

export function useDeleteDepartment() {
  return useMutation({
    mutationFn: (id: number) => deleteDepartment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.departments() }),
  });
}
