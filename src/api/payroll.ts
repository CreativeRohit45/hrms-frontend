// src/api/payroll.ts
import apiClient from "./axios";
import type { PayslipResponse } from "../types/payroll";

const BASE = "/api/v1/payroll";

export const generatePayrollBulk = (month: number, year: number) => 
  apiClient.post(`${BASE}/run-bulk?month=${month}&year=${year}`).then(r => r.data);

export const getCompanyPayroll = (month: number, year: number) => 
  apiClient.get<PayslipResponse[]>(`${BASE}/company-payroll?month=${month}&year=${year}`).then(r => r.data);

export const getMyPayslips = () => 
  apiClient.get<PayslipResponse[]>(`${BASE}/my`).then(r => r.data);

export const lockPayroll = (month: number, year: number) => 
  apiClient.post(`${BASE}/lock?month=${month}&year=${year}`).then(r => r.data);

export const getPayslipDetail = (recordId: number) => 
  apiClient.get<PayslipResponse>(`${BASE}/payslip/${recordId}`).then(r => r.data);

export const downloadPayslip = (recordId: number) =>
  apiClient.get(`${BASE}/payslip/${recordId}/download`, {
    responseType: 'blob'
  });

export const recalculateRecord = (recordId: number) =>
  apiClient.post(`${BASE}/records/${recordId}/recalculate`).then(r => r.data);

export const addAdjustment = (recordId: number, type: string, amount: number, description: string) =>
  apiClient.post(`${BASE}/records/${recordId}/adjustments?type=${type}&amount=${amount}&description=${description}`).then(r => r.data);

export const deleteAdjustment = (adjustmentId: number) =>
  apiClient.delete(`${BASE}/adjustments/${adjustmentId}`).then(r => r.data);
