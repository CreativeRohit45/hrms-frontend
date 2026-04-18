// ═══════════════════════════════════════════════════════════════════
//  QUERY KEY FACTORY — Single source of truth for all cache keys.
//  Never hardcode query keys in components. Always reference this file.
// ═══════════════════════════════════════════════════════════════════

export const queryKeys = {
  // ── Dashboard ──
  dashboard: () => ['dashboard'] as const,

  // ── Attendance ──
  attendance: {
    all: () => ['attendance'] as const,
    myLogs: (employeeCode: string) => ['attendance', 'myLogs', employeeCode] as const,
    employeeLogs: (employeeCode: string) => ['attendance', 'employeeLogs', employeeCode] as const,
    roster: (date: string) => ['attendance', 'roster', date] as const,
    dashboardStats: (employeeCode: string) => ['attendance', 'dashboardStats', employeeCode] as const,
    pendingCorrections: () => ['attendance', 'pendingCorrections'] as const,
  },

  // ── Leaves ──
  leaves: {
    all: () => ['leaves'] as const,
    myRequests: () => ['leaves', 'myRequests'] as const,
    myBalances: () => ['leaves', 'myBalances'] as const,
    pending: () => ['leaves', 'pending'] as const,
    types: () => ['leaves', 'types'] as const,
    teamAvailability: () => ['leaves', 'teamAvailability'] as const,
    deptAbsentees: () => ['leaves', 'deptAbsentees'] as const,
    employeeBalances: (employeeId: number) => ['leaves', 'employeeBalances', employeeId] as const,
    auditTrail: (leaveTypeId?: number, year?: number) => ['leaves', 'audit', leaveTypeId, year] as const,
  },

  // ── Payroll ──
  payroll: {
    company: (month: number, year: number) => ['payroll', 'company', month, year] as const,
    myPayslips: () => ['payroll', 'myPayslips'] as const,
  },

  // ── Gatepasses ──
  gatepasses: {
    all: () => ['gatepasses'] as const,
    myRequests: () => ['gatepasses', 'myRequests'] as const,
    pending: () => ['gatepasses', 'pending'] as const,
  },

  // ── Employees ──
  employees: {
    all: () => ['employees', 'all'] as const,
    detail: (id: number) => ['employees', 'detail', id] as const,
  },
} as const;
