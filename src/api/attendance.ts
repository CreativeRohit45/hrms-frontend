// src/api/attendance.ts
import apiClient from "./axios";
import type { AttendanceLogResponse } from "../types/attendance";

/**
 * GET /api/v1/attendance/my-logs
 * Returns the logged-in employee's own attendance records.
 * Parameters are optional; the backend defaults to the current month for the current user.
 */
export async function getMyAttendanceLogs(
  employeeId?: number,
  startDate?: string,
  endDate?: string
): Promise<AttendanceLogResponse[]> {
  const response = await apiClient.get<AttendanceLogResponse[]>(
    "/api/v1/attendance/my-logs",
    { params: { employeeId, startDate, endDate } }
  );
  return response.data;
}

/**
 * GET /api/v1/attendance/employee/{employeeCode}/logs
 * Returns historical logs for a specific employee (Manager/Admin use).
 */
export async function getEmployeeLogs(employeeCode: string): Promise<AttendanceLogResponse[]> {
  const response = await apiClient.get<AttendanceLogResponse[]>(
    `/api/v1/attendance/employee/${employeeCode}/logs`
  );
  return response.data;
}

/**
 * GET /api/v1/attendance/roster
 * Returns all attendance logs for a specific date (Manager/Admin use).
 */
export async function getDailyAttendanceLogs(date: string): Promise<AttendanceLogResponse[]> {
  const response = await apiClient.get<AttendanceLogResponse[]>(
    `/api/v1/attendance/roster?date=${date}`
  );
  return response.data;
}

/**
 * POST /api/v1/attendance/punch-in
 * Body: { latitude, longitude }
 */
export async function punchIn(
  latitude: number,
  longitude: number
): Promise<AttendanceLogResponse> {
  const response = await apiClient.post<AttendanceLogResponse>(
    "/api/v1/attendance/punch-in",
    { latitude, longitude }
  );
  return response.data;
}

/**
 * POST /api/v1/attendance/punch-out
 * Body: { latitude, longitude }
 */
export async function punchOut(
  latitude: number,
  longitude: number
): Promise<AttendanceLogResponse> {
  const response = await apiClient.post<AttendanceLogResponse>(
    "/api/v1/attendance/punch-out",
    { latitude, longitude }
  );
  return response.data;
}

/**
 * POST /api/v1/attendance/corrections/{logId}
 * Body: { requestedPunchInTime, requestedPunchOutTime, reason }
 */
export async function requestCorrection(
  logId: number, 
  requestedPunchInTime: string, 
  requestedPunchOutTime: string, 
  reason: string
): Promise<AttendanceLogResponse> {
  const response = await apiClient.post<AttendanceLogResponse>(
    `/api/v1/attendance/corrections/${logId}`, 
    { requestedPunchInTime, requestedPunchOutTime, reason }
  );
  return response.data;
}

/**
 * PUT /api/v1/attendance/corrections/{logId}/approve
 */
export async function approveCorrection(logId: number): Promise<AttendanceLogResponse> {
  const response = await apiClient.put<AttendanceLogResponse>(
    `/api/v1/attendance/corrections/${logId}/approve`
  );
  return response.data;
}

/**
 * PUT /api/v1/attendance/corrections/{logId}/reject
 */
export async function rejectCorrection(logId: number, reason: string): Promise<AttendanceLogResponse> {
  const response = await apiClient.put<AttendanceLogResponse>(
    `/api/v1/attendance/corrections/${logId}/reject`, 
    reason, 
    { headers: { "Content-Type": "text/plain" } }
  );
  return response.data;
}

/**
 * PUT /api/v1/attendance/{logId}/approve-overtime
 */
export async function approveOvertime(logId: number): Promise<AttendanceLogResponse> {
  const response = await apiClient.put<AttendanceLogResponse>(
    `/api/v1/attendance/${logId}/approve-overtime`
  );
  return response.data;
}