// src/api/leaves.ts ── Leave Management API Client
import apiClient from "./axios";
import type {
  LeaveTypeDTO,
  LeaveBalanceResponse,
  LeaveResponse,
  LeaveApplyRequest,
  LeaveActionRequest,
  LeaveGrantRequest,
  LeaveBalanceAuditResponse,
  LeavePreviewResponse,
  LeaveOverrideRequest,
  TeamMemberOnLeave,
  DepartmentAbsenteeDTO,
} from "../types/leave";
import type { PageResponse } from "../types/common";

// ═══════════════════════════════════════════════════════════════════
//  EMPLOYEE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

export async function applyForLeave(data: LeaveApplyRequest): Promise<LeaveResponse> {
  const res = await apiClient.post<LeaveResponse>("/api/v1/leaves", data);
  return res.data;
}

export async function getMyLeaves(): Promise<LeaveResponse[]> {
  const res = await apiClient.get<LeaveResponse[]>("/api/v1/leaves/my-requests");
  return res.data;
}

export async function getMyBalances(): Promise<LeaveBalanceResponse[]> {
  const res = await apiClient.get<LeaveBalanceResponse[]>("/api/v1/leaves/balances");
  return res.data;
}

export async function getMyAuditTrail(
  page: number = 0,
  size: number = 20,
  leaveTypeId?: number,
  year?: number
): Promise<PageResponse<LeaveBalanceAuditResponse>> {
  const params: Record<string, string> = { page: String(page), size: String(size) };
  if (leaveTypeId) params.leaveTypeId = String(leaveTypeId);
  if (year) params.year = String(year);
  const res = await apiClient.get<PageResponse<LeaveBalanceAuditResponse>>("/api/v1/leaves/balances/audit", { params });
  return res.data;
}

export async function cancelLeave(leaveId: number): Promise<LeaveResponse> {
  const res = await apiClient.put<LeaveResponse>(`/api/v1/leaves/${leaveId}/cancel`);
  return res.data;
}

export async function previewLeave(data: LeaveApplyRequest): Promise<LeavePreviewResponse> {
  const res = await apiClient.post<LeavePreviewResponse>("/api/v1/leaves/preview", data);
  return res.data;
}

export async function getTeamAvailability(): Promise<TeamMemberOnLeave[]> {
  const res = await apiClient.get<TeamMemberOnLeave[]>("/api/v1/leaves/team-availability");
  return res.data;
}

export async function getDepartmentAbsentees(): Promise<DepartmentAbsenteeDTO[]> {
  const res = await apiClient.get<DepartmentAbsenteeDTO[]>("/api/v1/leaves/dept-absentees");
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════
//  MANAGER / ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

export async function getPendingLeaves(): Promise<LeaveResponse[]> {
  const res = await apiClient.get<LeaveResponse[]>("/api/v1/leaves/pending");
  return res.data;
}

export async function approveLeave(leaveId: number): Promise<LeaveResponse> {
  const res = await apiClient.put<LeaveResponse>(`/api/v1/leaves/${leaveId}/approve`);
  return res.data;
}

export async function rejectLeave(leaveId: number, data: LeaveActionRequest): Promise<LeaveResponse> {
  const res = await apiClient.put<LeaveResponse>(`/api/v1/leaves/${leaveId}/reject`, data);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════
//  HR ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

export async function revokeLeave(leaveId: number, reason: string): Promise<LeaveResponse> {
  const res = await apiClient.put<LeaveResponse>(`/api/v1/leaves/admin/${leaveId}/revoke`, { reason });
  return res.data;
}

export async function grantLeave(data: LeaveGrantRequest): Promise<LeaveBalanceResponse> {
  const res = await apiClient.post<LeaveBalanceResponse>("/api/v1/leaves/admin/grant", data);
  return res.data;
}

export async function overrideBalance(data: LeaveOverrideRequest): Promise<LeaveBalanceResponse> {
  const res = await apiClient.post<LeaveBalanceResponse>("/api/v1/leaves/admin/override", data);
  return res.data;
}

export async function getEmployeeBalances(employeeId: number): Promise<LeaveBalanceResponse[]> {
  const res = await apiClient.get<LeaveBalanceResponse[]>(`/api/v1/leaves/admin/balances/${employeeId}`);
  return res.data;
}

export async function getEmployeeAuditTrail(
  employeeId: number,
  page: number = 0,
  size: number = 20,
  leaveTypeId?: number,
  year?: number
): Promise<PageResponse<LeaveBalanceAuditResponse>> {
  const params: Record<string, string> = { page: String(page), size: String(size) };
  if (leaveTypeId) params.leaveTypeId = String(leaveTypeId);
  if (year) params.year = String(year);
  const res = await apiClient.get<PageResponse<LeaveBalanceAuditResponse>>(
    `/api/v1/leaves/admin/audit/${employeeId}`, { params }
  );
  return res.data;
}

export async function getEmployeeRequests(employeeId: number): Promise<LeaveResponse[]> {
  const res = await apiClient.get<LeaveResponse[]>(`/api/v1/leaves/admin/requests/${employeeId}`);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════
//  REFERENCE DATA
// ═══════════════════════════════════════════════════════════════════

export async function getLeaveTypes(): Promise<LeaveTypeDTO[]> {
  const res = await apiClient.get<LeaveTypeDTO[]>("/api/v1/leaves/types");
  return res.data;
}

export async function bulkGrantLeaves(data: { employeeIds: number[]; leaveTypeId: number; amount: number; reason: string }): Promise<void> {
  await apiClient.post("/api/v1/leaves/admin/bulk-grant", data);
}

// ── Admin Leave Type CRUD ───────────────────────────────────────────

export async function adminGetAllLeaveTypes(): Promise<LeaveTypeDTO[]> {
  const res = await apiClient.get<LeaveTypeDTO[]>("/api/v1/leaves/admin/types");
  return res.data;
}

export async function adminCreateLeaveType(data: Partial<LeaveTypeDTO>): Promise<LeaveTypeDTO> {
  const res = await apiClient.post<LeaveTypeDTO>("/api/v1/leaves/admin/types", data);
  return res.data;
}

export async function adminUpdateLeaveType(id: number, data: Partial<LeaveTypeDTO>): Promise<LeaveTypeDTO> {
  const res = await apiClient.put<LeaveTypeDTO>(`/api/v1/leaves/admin/types/${id}`, data);
  return res.data;
}

export async function adminDeleteLeaveType(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/leaves/admin/types/${id}`);
}

export async function runManualAccrual(): Promise<void> {
  await apiClient.post("/api/v1/leaves/admin/accrual/run");
}
