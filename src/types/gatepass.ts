// src/types/gatepass.ts ── Gatepass Management Type Definitions

export type GatepassStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type GatepassType = "OFFICIAL" | "PERSONAL";

export interface GatepassResponse {
  id: number;
  employeeId: number;
  employeeCode: string;
  fullName: string;
  attendanceLogId: number | null;
  requestDate: string;
  requestedOutTime: string;
  requestedInTime: string;
  actualOutTime: string | null;
  actualInTime: string | null;
  gatepassType: GatepassType;
  status: GatepassStatus;
  reason: string;
  approvedById: number | null;
  approvedByName: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface GatepassApplyRequest {
  requestedOutTime: string;
  requestedInTime: string;
  gatepassType: GatepassType;
  reason: string;
}

export interface GatepassActionRequest {
  rejectionReason: string;
}
