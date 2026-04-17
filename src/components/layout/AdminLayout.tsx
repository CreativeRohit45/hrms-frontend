import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutGrid, Users, Clock3, ClipboardList, Wallet, Settings, 
  UserCircle2, ReceiptText, CalendarDays, MoonStar, 
  SunMedium, LogOut, Menu, X, ChevronRight, Inbox 
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getGroupedNavItems } from "../../lib/navigation";
import type { NavGroup } from "../../lib/navigation";
import { StatusBadge } from "../ui/StatusBadge";

const GROUP_ICONS: Record<NavGroup, LucideIcon> = {
  "My Space": UserCircle2,
  "Team Space": Users,
  "HR Operations": LayoutGrid,
  "System Settings": Settings,
};

const ITEM_ICONS: Record<string, LucideIcon> = {
  "/app/dashboard": LayoutGrid,
  "/app/employees": Users,
  "/app/profile": UserCircle2,
  "/app/attendance": Clock3,
  "/app/requests": ClipboardList,
  "/app/team/roster": CalendarDays,
  "/app/team/inbox": Inbox,
  "/app/payroll": Wallet,
  "/app/my-payslips": ReceiptText,
  "/app/settings": Settings,
};

export default function AdminLayout() {
  const { user, logout, payrollLockDate } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "My Space": true,
    "Team Space": true,
    "HR Operations": true,
    "System Settings": true,
  });

  const groupedNav = useMemo(() => getGroupedNavItems(user?.role), [user?.role]);

  const mobileBottomNav = useMemo(() => {
    const preferred = ["/app/dashboard", "/app/attendance", "/app/requests", "/app/my-payslips", "/app/profile"];
    const allItems = groupedNav.flatMap(([_, items]) => items);
    return preferred.map((path) => allItems.find((item) => item.path === path)).filter(Boolean);
  }, [groupedNav]);

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const title = location.pathname.split("/").pop() || "dashboard";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
      <div className="flex min-h-screen pb-20 md:pb-0">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden w-72 shrink-0 border-r border-gray-200 bg-white md:flex md:flex-col dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-bold">CoreSync HRMS</p>
                <p className="text-xs uppercase tracking-[0.25em] text-indigo-500">Workplace Suite</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-4">
              {groupedNav.map(([group, items]) => {
                const Icon = GROUP_ICONS[group];
                const isOpen = openGroups[group];
                
                return (
                  <div key={group} className="space-y-1">
                    <button 
                      onClick={() => toggleGroup(group)}
                      className="group flex w-full items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 transition-colors hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {group}
                      </div>
                      <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                    </button>
                    
                    {isOpen && (
                      <div className="mt-1 space-y-1">
                        {items.map((item) => {
                          const ItemIcon = ITEM_ICONS[item.path] || LayoutGrid;
                          return (
                            <NavLink
                              key={item.path}
                              to={item.path}
                              className={({ isActive }) => `
                                flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all
                                ${isActive 
                                  ? "bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-950/40 dark:text-indigo-300" 
                                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"}
                              `}
                            >
                              <ItemIcon className="h-4 w-4" />
                              <span>{item.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-gray-100 p-4 dark:border-gray-800">
            <div className="rounded-2xl bg-gray-50 p-3 dark:bg-gray-800/70">
              <p className="text-sm font-semibold">{user?.fullName || "User"}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{user?.employeeCode}</p>
              <div className="mt-3 flex items-center justify-between">
                <StatusBadge label={user?.role.replaceAll("_", " ") || "Employee"} tone="info" />
                <button onClick={handleLogout} className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-white hover:text-red-500 dark:hover:bg-gray-900">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur md:px-6 dark:border-gray-800 dark:bg-gray-900/95">
            <div className="flex h-16 items-center justify-between px-4 md:px-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen((open) => !open)}
                  className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 md:hidden dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Workplace</p>
                  <p className="text-base font-bold capitalize">{title.replaceAll("-", " ")}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {payrollLockDate && payrollLockDate !== "1970-01-01" && (
                  <StatusBadge label={`Payroll lock ${payrollLockDate}`} tone="warning" />
                )}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                >
                  {isDark ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </header>

          {/* MOBILE NAVIGATION OVERLAY */}
          {mobileOpen && (
            <div className="fixed inset-0 z-50 bg-white p-4 md:hidden dark:bg-gray-950">
               <div className="mb-8 flex items-center justify-between">
                 <p className="text-lg font-bold">Navigation</p>
                 <button onClick={() => setMobileOpen(false)} className="rounded-xl bg-gray-100 p-2 dark:bg-gray-900">
                   <X className="h-6 w-6" />
                 </button>
               </div>
               <div className="space-y-6">
                {groupedNav.map(([group, items]) => (
                  <div key={group}>
                    <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">{group}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {items.map((item) => {
                        const ItemIcon = ITEM_ICONS[item.path] || LayoutGrid;
                        return (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) => `
                              flex items-center gap-3 rounded-2xl border p-3 text-sm font-semibold transition-all
                              ${isActive 
                                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" 
                                : "border-gray-100 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"}
                            `}
                          >
                            <ItemIcon className="h-4 w-4" />
                            {item.label}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <main className="flex-1 px-4 py-6 md:px-6">
            <Outlet />
          </main>
        </div>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden dark:border-gray-800 dark:bg-gray-900/95">
        <div className="grid grid-cols-5 gap-1">
          {mobileBottomNav.map((item) => {
            if (!item) return null;
            const ItemIcon = ITEM_ICONS[item.path] || LayoutGrid;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex flex-col items-center rounded-2xl px-2 py-2 text-[10px] font-bold tracking-tight transition-all
                  ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500"}
                `}
              >
                <div className={`mb-1 flex h-8 w-12 items-center justify-center rounded-2xl transition-all ${location.pathname === item.path ? 'bg-indigo-50 dark:bg-indigo-950/40' : ''}`}>
                  <ItemIcon className="h-5 w-5" />
                </div>
                {item.mobileLabel || item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
