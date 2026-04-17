import apiClient from "./axios";

export interface SystemInfo {
  serverTime: string;      // ISO string
  payrollLockDate: string;  // "YYYY-MM-DD"
}

export async function getSystemInfo(): Promise<SystemInfo> {
  const res = await apiClient.get<SystemInfo>("/api/v1/system/info");
  return res.data;
}
