// src/types/payroll.ts

export type PayrollStatus = "DRAFT" | "PROCESSED" | "APPROVED" | "LOCKED" | "PAID";

export interface PayrollRecord {
  id: number;
  employeeCode: string;
  fullName: string;
  period: string;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  status: PayrollStatus;
  processedAt: string;
}

export interface PayslipResponse {
  recordId: number;
  employeeCode: string;
  fullName: string;
  departmentName: string;
  designation: string;
  period: string;
  
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  
  grossPay: number;
  deductionPf: number;
  deductionEsi: number;
  deductionTds: number;
  totalDeductions: number;
  netPay: number;
  
  status: PayrollStatus | string;
}
