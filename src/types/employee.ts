import type { EmployeeRole } from "./auth";

export type PaymentType = "HOURLY" | "DAILY_WAGE" | "FIXED_MONTHLY";
export type EmployeeStatus = "ACTIVE" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";

export interface EmployeeResponse {
  id: number;
  employeeCode: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  dateOfBirth: string | null;
  dateOfJoining: string;
  departmentId: number;
  departmentName: string;
  designation: string;
  shiftId: number;
  shiftName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  locationId: number;
  locationName: string;
  paymentType: PaymentType;
  hourlyRate: number;
  overtimeRateMultiplier: number;
  status: EmployeeStatus;
  role: EmployeeRole;
  baseSalary: number | null;
  hraPercentage: number | null;
  pfPercentage: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeCreateRequest {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  dateOfJoining: string;
  departmentId: number;
  designation: string;
  shiftId: number;
  locationId: number;
  paymentType: PaymentType;
  hourlyRate: number;
  overtimeRateMultiplier: number;
  role: EmployeeRole;
  baseSalary?: number;
  hraPercentage?: number;
  pfPercentage?: number;
}

export interface EmployeeUpdateRequest extends EmployeeCreateRequest {
  status: EmployeeStatus;
}

export interface EmployeeFormState {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  dateOfJoining: string;
  departmentId: string;
  designation: string;
  shiftId: string;
  locationId: string;
  paymentType: PaymentType | "";
  hourlyRate: string;
  overtimeRateMultiplier: string;
  role: EmployeeRole | "";
  baseSalary: string;
  hraPercentage: string;
  pfPercentage: string;
}

export const EMPTY_FORM: EmployeeFormState = {
  fullName: "", phone: "", email: "", dateOfBirth: "", dateOfJoining: "",
  departmentId: "", designation: "", shiftId: "", locationId: "",
  paymentType: "", hourlyRate: "", overtimeRateMultiplier: "1.50", role: "",
  baseSalary: "", hraPercentage: "40", pfPercentage: "12",
};

// Dropdown options are now fetched dynamically from the API in the components.

export const PAYMENT_TYPE_OPTIONS: { value: PaymentType; label: string }[] = [
  { value: "HOURLY", label: "Hourly" },
  { value: "DAILY_WAGE", label: "Daily Wage" },
  { value: "FIXED_MONTHLY", label: "Fixed Monthly" },
];

export const ROLE_OPTIONS: { value: EmployeeRole; label: string }[] = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "DEPARTMENT_MANAGER", label: "Department Manager" },
  { value: "HR_ADMIN", label: "HR Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];