import apiClient from "./axios";

export interface AnalyticsSummary {
  totalEmployees: number;
  totalLeaves: number;
  attendanceAnomalies: number;
  gatepassCount: number;
  trendData: {
    day: string;
    leaves: number;
    anomalies: number;
    gatepasses: number;
  }[];
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const response = await apiClient.get<AnalyticsSummary>("/api/v1/analytics/summary");
  return response.data;
}
