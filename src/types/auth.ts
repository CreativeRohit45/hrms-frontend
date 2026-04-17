export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresInMs: number;
  employeeCode: string;
  fullName: string;
  role: EmployeeRole;
}

export type EmployeeRole = "EMPLOYEE" | "DEPARTMENT_MANAGER" | "HR_ADMIN" | "SUPER_ADMIN";

export interface AuthUser {
  accessToken: string;
  employeeCode: string;
  fullName: string;
  role: EmployeeRole;
  expiresInMs: number;
}