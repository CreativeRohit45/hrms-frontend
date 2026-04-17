// src/types/leave.ts ── Leave Management Type Definitions

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface LeaveTypeDTO {
  id: number;
  name: string;
  code: string;
  paid: boolean;
  requiresAttachment: boolean;
  attachmentThresholdDays: number;
  allowedGenders: string | null;
  maxDaysPerRequest: number | null;
  requiresProbationCompletion: boolean;
  allowNegativeBalance: boolean;
  defaultAnnualQuota: number;
  monthlyAccrualRate: number;
  carryForwardAllowed: boolean;
  maxCarryForwardDays: number;
  active: boolean;
}

export interface LeaveBalanceResponse {
  leaveTypeId: number;
  leaveTypeName: string;
  leaveTypeCode: string;
  allocated: number;
  used: number;
  balance: number;
  year: number;
}

export interface LeaveResponse {
  id: number;
  employeeId: number;
  employeeCode: string;
  fullName: string;
  leaveTypeId: number;
  leaveTypeName: string;
  leaveTypeCode: string;
  startDate: string;
  endDate: string;
  appliedDays: number;
  reason: string | null;
  status: LeaveStatus;
  halfDay: boolean;
  halfDaySession: string | null;
  attachmentUrl: string | null;
  actionByUserId: number | null;
  actionByName: string | null;
  actionAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface LeaveApplyRequest {
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  reason?: string;
  halfDay: boolean;
  halfDaySession?: string;
  attachmentUrl?: string;
}

export interface LeaveActionRequest {
  rejectionReason: string;
}

export interface LeaveGrantRequest {
  employeeId: number;
  leaveTypeId: number;
  amount: number;
  reason: string;
}

export interface LeaveBalanceAuditResponse {
  id: number;
  leaveTypeName: string;
  leaveTypeCode: string;
  transactionType: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  referenceLeaveId: number | null;
  performedByUserId: number | null;
  createdAt: string;
}

export interface LeavePreviewResponse {
  appliedDays: number;
  leaveTypeName: string;
  leaveTypeCode: string;
  currentBalance: number;
  balanceAfterDeduction: number;
  requiresAttachment: boolean;
  isPaid: boolean;
  warnings: string[];
}

export interface TeamMemberOnLeave {
  employeeCode: string;
  fullName: string;
  designation: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  startDate: string;
  endDate: string;
  halfDay: boolean;
  halfDaySession: string | null;
}

export interface DepartmentAbsenteeDTO {
  employeeId: number;
  fullName: string;
  employeeCode: string;
  departmentName: string;
  initials: string;
  status: "ABSENT" | "ON_LEAVE";
  leaveTypeCode: string | null;
}

