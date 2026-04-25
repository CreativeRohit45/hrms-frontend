// src/api/settings.ts
import apiClient from "./axios";

// ── Shifts ────────────────────────────────────────────────────────────────────
export interface Shift {
  id?: number;
  shiftName: string;
  startTime: string;    // "HH:mm:ss" in UTC
  endTime: string;      // "HH:mm:ss" in UTC
  unpaidBreakMinutes: number;
  overnight: boolean;
  standardHours: number;
  gracePeriodMinutes: number;
  active: boolean;
}

export async function getShifts(): Promise<Shift[]> {
  const res = await apiClient.get<Shift[]>("/api/v1/shifts");
  return res.data;
}

export async function createShift(shift: Shift): Promise<Shift> {
  const res = await apiClient.post<Shift>("/api/v1/shifts", shift);
  return res.data;
}

export async function updateShift(id: number, shift: Shift): Promise<Shift> {
  const res = await apiClient.put<Shift>(`/api/v1/shifts/${id}`, shift);
  return res.data;
}

export async function deleteShift(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/shifts/${id}`);
}

// ── Holidays ──────────────────────────────────────────────────────────────────
export interface Holiday {
  id?: number;
  name: string;
  holidayDate: string;  // "YYYY-MM-DD"
  description: string;
}

export async function getHolidays(): Promise<Holiday[]> {
  const res = await apiClient.get<Holiday[]>("/api/v1/holidays");
  return res.data;
}

export async function createHoliday(h: Holiday): Promise<Holiday> {
  const res = await apiClient.post<Holiday>("/api/v1/holidays", h);
  return res.data;
}

export async function updateHoliday(id: number, h: Holiday): Promise<Holiday> {
  const res = await apiClient.put<Holiday>(`/api/v1/holidays/${id}`, h);
  return res.data;
}

export async function deleteHoliday(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/holidays/${id}`);
}

// ── Company Locations ─────────────────────────────────────────────────────────
export interface CompanyLocation {
  id?: number;
  locationName: string;
  address: string;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number;
  weekendDays: string;  // "Saturday,Sunday"
  active: boolean;
}

export async function getLocations(): Promise<CompanyLocation[]> {
  const res = await apiClient.get<CompanyLocation[]>("/api/v1/company-locations");
  return res.data;
}

export async function updateLocation(id: number, loc: CompanyLocation): Promise<CompanyLocation> {
  const res = await apiClient.put<CompanyLocation>(`/api/v1/company-locations/${id}`, loc);
  return res.data;
}

export async function createLocation(loc: CompanyLocation): Promise<CompanyLocation> {
  const res = await apiClient.post<CompanyLocation>("/api/v1/company-locations", loc);
  return res.data;
}

// ── Departments ───────────────────────────────────────────────────────────────
export interface Department {
  id?: number;
  name: string;
  description: string;
  active: boolean;
}

export async function getDepartments(): Promise<Department[]> {
  const res = await apiClient.get<Department[]>("/api/v1/departments");
  return res.data;
}

export async function createDepartment(dept: Department): Promise<Department> {
  const res = await apiClient.post<Department>("/api/v1/departments", dept);
  return res.data;
}

export async function updateDepartment(id: number, dept: Department): Promise<Department> {
  const res = await apiClient.put<Department>(`/api/v1/departments/${id}`, dept);
  return res.data;
}

export async function deleteDepartment(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/departments/${id}`);
}
// ── Leave Types ───────────────────────────────────────────────────────────────
export interface LeaveType {
  id?: number;
  name: string;
  code: string;
  paid: boolean;
  requiresAttachment: boolean;
  attachmentThresholdDays: number;
  allowedGenders?: string;
  maxDaysPerRequest?: number;
  requiresProbationCompletion: boolean;
  allowNegativeBalance: boolean;
  defaultAnnualQuota: number;
  monthlyAccrualRate: number;
  carryForwardAllowed: boolean;
  maxCarryForwardDays: number;
  active: boolean;
}

export async function getLeaveTypes(): Promise<LeaveType[]> {
  const res = await apiClient.get<LeaveType[]>("/api/v1/leaves/admin/types");
  return res.data;
}

export async function createLeaveType(lt: LeaveType): Promise<LeaveType> {
  const res = await apiClient.post<LeaveType>("/api/v1/leaves/admin/types", lt);
  return res.data;
}

export async function updateLeaveType(id: number, lt: LeaveType): Promise<LeaveType> {
  const res = await apiClient.put<LeaveType>(`/api/v1/leaves/admin/types/${id}`, lt);
  return res.data;
}

export async function deleteLeaveType(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/leaves/admin/types/${id}`);
}
