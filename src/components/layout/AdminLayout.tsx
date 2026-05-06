import { useMemo, useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid, Users, Clock3, ClipboardList, Wallet, Settings,
  UserCircle2, ReceiptText, CalendarDays, MoonStar,
  SunMedium, LogOut, Menu, X, ChevronRight, Inbox,
  User, ChevronLeft, Layers
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getGroupedNavItems } from "../../lib/navigation";
import { StatusBadge } from "../ui/StatusBadge";
import { Breadcrumbs } from "../ui/Breadcrumbs";

const ITEM_ICONS: Record<string, LucideIcon> = {
  "/app/dashboard": LayoutGrid,
  "/app/employees": Users,
  "/app/profile": UserCircle2,
  "/app/attendance": Clock3,
  "/app/requests": ClipboardList,
  "/app/team/roster": CalendarDays,
  "/app/team/inbox": Inbox,
  "/app/payroll": Wallet,
  "/app/bulk-ops": Layers,
  "/app/my-payslips": ReceiptText,
  "/app/settings": Settings,
};

export default function AdminLayout() {
  const { user, logout, payrollLockDate } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "My Space": true,
    "Team Space": true,
    "HR Operations": true,
    "System Settings": true,
  });

  const groupedNav = useMemo(() => getGroupedNavItems(user?.role), [user?.role]);

  // Fix: Scroll lock for mobile menu
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileOpen]);

  const toggleGroup = (group: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }



  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">

      {/* 🛠️ TOP NAVIGATION HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur transition-all dark:border-gray-800 dark:bg-gray-900/95">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 md:hidden dark:hover:bg-gray-800"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 md:flex">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black tracking-tighter md:text-sm">CoreSync</p>
              <p className="hidden text-[9px] uppercase tracking-[0.2em] text-indigo-500 font-bold md:block">HRMS Hub</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-4">
          {payrollLockDate && payrollLockDate !== "1970-01-01" && (
            <div className="hidden lg:block">
              <StatusBadge label={`Payroll locked ${payrollLockDate}`} tone="warning" />
            </div>
          )}


          <button
            onClick={toggleTheme}
            className="rounded-xl p-2 text-gray-400 transition-all hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-800"
          >
            {isDark ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
          </button>

          <NavLink
            to="/app/profile"
            className="group flex items-center gap-2 rounded-2xl p-1 pr-2 transition-all hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-sm transition-transform group-hover:scale-95">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden flex-col text-left md:flex">
              <p className="text-[11px] font-black leading-none text-gray-900 dark:text-white">{user?.fullName?.split(' ')[0]}</p>
              <p className="mt-0.5 text-[9px] font-bold text-gray-400">{user?.employeeCode}</p>
            </div>
          </NavLink>

          <button
            onClick={handleLogout}
            className="rounded-xl p-2 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex pt-16">

        {/* 🛠️ COLLAPSIBLE SIDEBAR */}
        <aside className={`
          fixed left-0 top-16 bottom-0 z-40 hidden border-r border-gray-200 bg-white transition-all duration-300 md:flex md:flex-col dark:border-gray-800 dark:bg-gray-900
          ${isCollapsed ? 'w-20' : 'w-72'}
        `}>
          <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-none">
            <div className="space-y-6">
              {groupedNav.map(([group, items]) => {

                const isOpen = openGroups[group];

                return (
                  <div key={group} className="space-y-2">
                    {!isCollapsed ? (
                      <button
                        onClick={() => toggleGroup(group)}
                        className="flex w-full items-center justify-between px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500"
                      >
                        <span>{group}</span>
                        <ChevronRight className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                      </button>
                    ) : (
                      <div className="flex h-px w-full bg-gray-100 dark:bg-gray-800" />
                    )}

                    <div className="space-y-1">
                      {items.map((item) => {
                        const ItemIcon = ITEM_ICONS[item.path] || LayoutGrid;
                        return (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                              flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-all
                              ${isActive
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                : "text-gray-500 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-gray-800"}
                              ${isCollapsed ? 'justify-center px-0' : ''}
                            `}
                          >
                            <ItemIcon className="h-5 w-5 shrink-0" />
                            {!isCollapsed && <span>{item.label}</span>}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </nav>

          {/* COLLAPSE TOGGLE */}
          <div className="border-t border-gray-100 p-4 dark:border-gray-800">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex w-full items-center justify-center rounded-2xl bg-gray-50 py-3 text-gray-400 transition-all hover:bg-indigo-50 hover:text-indigo-600 dark:bg-gray-800/50 dark:hover:bg-indigo-950/20"
            >
              {isCollapsed ? <ChevronRight className="h-5 w-5" /> : (
                <div className="flex items-center gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Collapse View</span>
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* 🛠️ NAVIGATION OVERLAY (MOBILE) */}
        {mobileOpen && (
          <div className="fixed inset-0 z-[60] bg-gray-950/20 backdrop-blur-sm md:hidden">
            <div className="h-full w-4/5 overflow-y-auto bg-white p-6 shadow-2xl scrollbar-none dark:bg-gray-900">
              <div className="mb-8 flex items-center justify-between">
                <p className="text-xl font-black">Menu</p>
                <button onClick={() => setMobileOpen(false)} className="rounded-xl bg-gray-100 p-2 dark:bg-gray-800">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-8">
                {groupedNav.map(([group, items]) => (
                  <div key={group}>
                    <p className="mb-4 text-xs font-black uppercase tracking-widest text-gray-400">{group}</p>
                    <div className="grid grid-cols-1 gap-2">
                      {items.map((item) => {
                        const ItemIcon = ITEM_ICONS[item.path] || LayoutGrid;
                        return (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) => `
                              flex items-center gap-4 rounded-2xl p-4 text-sm font-bold transition-all
                              ${isActive
                                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20"
                                : "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}
                            `}
                          >
                            <ItemIcon className="h-5 w-5" />
                            {item.label}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 🛠️ MAIN CONTENT AREA */}
        <main className={`
          min-w-0 flex-1 overflow-x-hidden transition-all duration-300 p-4 md:p-8
          ${isCollapsed ? 'md:ml-20' : 'md:ml-72'}
        `}>
          <div className="mx-auto max-w-7xl">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
