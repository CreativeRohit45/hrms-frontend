import type { EmployeeRole } from "../types/auth";

export type NavGroup = "My Space" | "Team Space" | "HR Operations" | "System Settings";

export interface NavItem {
  label: string;
  path: string;
  group: NavGroup;
  mobileLabel?: string;
  roles?: EmployeeRole[];
  excludeRoles?: EmployeeRole[];
}

export const NAV_ITEMS: NavItem[] = [
  // --- MY SPACE ---
  { label: "Dashboard", path: "/app/dashboard", group: "My Space", mobileLabel: "Home", excludeRoles: ["SUPER_ADMIN"] },
  { label: "Admin Dashboard", path: "/app/dashboard", group: "HR Operations", mobileLabel: "Home", roles: ["SUPER_ADMIN"] },
  { label: "My Profile", path: "/app/profile", group: "My Space", mobileLabel: "Profile", excludeRoles: ["SUPER_ADMIN"] },
  { label: "Attendance", path: "/app/attendance", group: "My Space", mobileLabel: "Attendance", excludeRoles: ["SUPER_ADMIN"] },
  { label: "My Requests", path: "/app/requests", group: "My Space", mobileLabel: "Self", excludeRoles: ["SUPER_ADMIN"] },
  { label: "My Payslips", path: "/app/my-payslips", group: "My Space", mobileLabel: "Payslips", excludeRoles: ["SUPER_ADMIN"] },

  // --- TEAM SPACE ---
  { 
    label: "Unified Inbox", 
    path: "/app/team/inbox", 
    group: "Team Space", 
    roles: ["HR_ADMIN", "SUPER_ADMIN", "DEPARTMENT_MANAGER"] 
  },
  { 
    label: "Daily Roster", 
    path: "/app/team/roster", 
    group: "Team Space", 
    roles: ["HR_ADMIN", "SUPER_ADMIN", "DEPARTMENT_MANAGER"] 
  },

  // --- HR OPERATIONS ---
  { 
    label: "Employee Directory", 
    path: "/app/employees", 
    group: "HR Operations", 
    roles: ["HR_ADMIN", "SUPER_ADMIN", "DEPARTMENT_MANAGER"] 
  },
  { 
    label: "Bulk Operations", 
    path: "/app/bulk-ops", 
    group: "HR Operations", 
    roles: ["HR_ADMIN", "SUPER_ADMIN"] 
  },
  { 
    label: "Payroll Engine", 
    path: "/app/payroll", 
    group: "HR Operations", 
    roles: ["HR_ADMIN", "SUPER_ADMIN"] 
  },

  // --- SYSTEM SETTINGS ---
  { 
    label: "Master Data", 
    path: "/app/settings", 
    group: "System Settings", 
    roles: ["SUPER_ADMIN"] 
  },
];

export function getVisibleNavItems(role?: EmployeeRole) {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => {
    // 1. Check exclusions first
    if (item.excludeRoles && item.excludeRoles.includes(role)) return false;
    // 2. Check inclusions
    return !item.roles || item.roles.includes(role);
  });
}

export function getGroupedNavItems(role?: EmployeeRole) {
  const items = getVisibleNavItems(role);
  const groups: Record<NavGroup, NavItem[]> = {
    "My Space": [],
    "Team Space": [],
    "HR Operations": [],
    "System Settings": [],
  };

  items.forEach((item) => {
    groups[item.group].push(item);
  });

  return Object.entries(groups).filter(([_, items]) => items.length > 0) as [NavGroup, NavItem[]][];
}
