import apiClient from "./axios";
import type { EmployeeCreateRequest, EmployeeResponse } from "../types/employee";

export async function getEmployees(): Promise<EmployeeResponse[]> {
  const response = await apiClient.get<EmployeeResponse[]>("/api/v1/employees");
  return response.data;
}

export async function getEmployeeById(id: number): Promise<EmployeeResponse> {
  const response = await apiClient.get<EmployeeResponse>(`/api/v1/employees/${id}`);
  return response.data;
}

export async function createEmployee(data: EmployeeCreateRequest): Promise<EmployeeResponse> {
  const response = await apiClient.post<EmployeeResponse>("/api/v1/employees", data);
  return response.data;
}

export async function updateEmployee(id: number, data: import("../types/employee").EmployeeUpdateRequest): Promise<EmployeeResponse> {
  const response = await apiClient.put<EmployeeResponse>(`/api/v1/employees/${id}`, data);
  return response.data;
}

export async function getMyProfile(): Promise<EmployeeResponse> {
  const response = await apiClient.get<EmployeeResponse>("/api/v1/employees/me");
  return response.data;
}

export async function updateMyProfile(data: { phone?: string; email?: string; photoUrl?: string }): Promise<EmployeeResponse> {
  const response = await apiClient.patch<EmployeeResponse>("/api/v1/employees/me", data);
  return response.data;
}

export async function deleteEmployee(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/employees/${id}`);
}