import apiClient from "./axios";

export interface LeaveBalanceDetail {
  leaveTypeName: string;
  leaveTypeCode: string;
  allocated: number;
  used: number;
  balance: number;
}

export interface DashboardStats {
  leavesTaken: number;
  leavesRemaining: number;
  totalLeaveQuota: number;
  leaveBalances: LeaveBalanceDetail[];
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  currentSession: {
    id: number;
    punchInTime: string;
    active: boolean;
  } | null;
  todayCompleted: boolean;
  todayTotalMinutes: number | null;
  weekendDays: string;
  upcomingHolidays: {
    name: string;
    date: string;
    description: string;
  }[];
  allHolidays: string[];
  recentLogs: {
    date: string;
    status: string;
    punchIn: string | null;
    punchOut: string | null;
  }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient.get<DashboardStats>("/api/v1/dashboard/me");
  return response.data;
}

export async function getEmployeeDashboardStats(employeeCode: string): Promise<DashboardStats> {
  const response = await apiClient.get<DashboardStats>(`/api/v1/dashboard/employee/${employeeCode}`);
  return response.data;
}
