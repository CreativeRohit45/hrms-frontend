import type { EmployeeRole } from "../types/auth";

export type NavGroup = "My Space" | "Team Space" | "HR Operations" | "System Settings";

export interface NavItem {
  label: string;
  path: string;
  group: NavGroup;
  mobileLabel?: string;
  roles?: EmployeeRole[];
}

export const NAV_ITEMS: NavItem[] = [
  // --- MY SPACE ---
  { label: "Dashboard", path: "/app/dashboard", group: "My Space", mobileLabel: "Home" },
  { label: "My Profile", path: "/app/profile", group: "My Space", mobileLabel: "Profile" },
  { label: "Attendance", path: "/app/attendance", group: "My Space", mobileLabel: "Attendance" },
  { label: "My Requests", path: "/app/requests", group: "My Space", mobileLabel: "Self" },
  { label: "My Payslips", path: "/app/my-payslips", group: "My Space", mobileLabel: "Payslips" },

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
  return NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)));
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
