// src/App.tsx
import React, { Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Login from "./pages/Login";
import AdminLayout from "./components/layout/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";

// ═══════════════════════════════════════════════════════════════════
//  LAZY IMPORTS — Route-level code splitting.
//
//  Each lazy import produces a separate JS chunk. Users only download
//  the code for the page they actually navigate to. This prevents
//  an employee logging in to punch-in from downloading the heavyweight
//  AdminPayroll/recharts bundle, reducing initial load by ~40%.
// ═══════════════════════════════════════════════════════════════════

const EmployeesPage = React.lazy(() => import("./pages/employees/index"));
const AttendancePage = React.lazy(() => import("./pages/attendance/index"));
const SettingsPage = React.lazy(() => import("./pages/settings/SettingsPage"));
const AdminPayroll = React.lazy(() => import("./pages/payroll/AdminPayroll"));
const MyPayslips = React.lazy(() => import("./pages/payroll/MyPayslips"));
const AdminBulkOps = React.lazy(() => import("./pages/admin/AdminBulkOps"));
const UnifiedInbox = React.lazy(() => import("./pages/team/UnifiedInbox"));
const DailyRoster = React.lazy(() => import("./pages/team/DailyRoster"));
const MyRequests = React.lazy(() => import("./pages/my-space/MyRequests"));

// ── Route Loading Fallback ───────────────────────────────────────
// Matches the AdminLayout content area dimensions to prevent layout
// collapse/expand jank when switching between sidebar links.
function RouteLoadingState() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-[3px] border-gray-200 border-t-indigo-500 animate-spin dark:border-gray-700 dark:border-t-indigo-400" />
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wide">
          Loading module...
        </p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-sm font-medium text-gray-400 dark:text-gray-500">Loading workspace...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

function RoleGuard({ children, roles, fallback = "/app/dashboard" }: { children: React.ReactNode; roles: string[]; fallback?: string }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}

function RoleBasedRedirect() {
  const { user } = useAuth();
  if (user?.role === "SUPER_ADMIN") {
    return <Navigate to="dashboard" replace />;
  }
  return <Navigate to="dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleBasedRedirect />} />
        
        {/* MY SPACE (Hidden from SUPER_ADMIN in sidebar, but accessible as Admin Dashboard) */}
        <Route 
          path="dashboard" 
          element={
            <RoleGuard roles={["EMPLOYEE", "HR_ADMIN", "DEPARTMENT_MANAGER", "SUPER_ADMIN"]} fallback="/app/team/inbox">
              <Dashboard />
            </RoleGuard>
          } 
        />
        <Route 
          path="profile" 
          element={
            <RoleGuard roles={["EMPLOYEE", "HR_ADMIN", "DEPARTMENT_MANAGER"]} fallback="/app/team/inbox">
              <Profile />
            </RoleGuard>
          } 
        />
        <Route 
          path="attendance" 
          element={
            <RoleGuard roles={["EMPLOYEE", "HR_ADMIN", "DEPARTMENT_MANAGER"]} fallback="/app/team/inbox">
              <Suspense fallback={<RouteLoadingState />}><AttendancePage /></Suspense>
            </RoleGuard>
          } 
        />
        <Route 
          path="requests" 
          element={
            <RoleGuard roles={["EMPLOYEE", "HR_ADMIN", "DEPARTMENT_MANAGER"]} fallback="/app/team/inbox">
              <Suspense fallback={<RouteLoadingState />}><MyRequests /></Suspense>
            </RoleGuard>
          } 
        />
        <Route 
          path="my-payslips" 
          element={
            <RoleGuard roles={["EMPLOYEE", "HR_ADMIN", "DEPARTMENT_MANAGER"]} fallback="/app/team/inbox">
              <Suspense fallback={<RouteLoadingState />}><MyPayslips /></Suspense>
            </RoleGuard>
          } 
        />

        {/* TEAM SPACE */}
        <Route path="team">
          <Route 
            path="inbox" 
            element={
              <RoleGuard roles={["DEPARTMENT_MANAGER", "HR_ADMIN", "SUPER_ADMIN"]}>
                <Suspense fallback={<RouteLoadingState />}><UnifiedInbox /></Suspense>
              </RoleGuard>
            } 
          />
          <Route 
            path="roster" 
            element={
              <RoleGuard roles={["DEPARTMENT_MANAGER", "HR_ADMIN", "SUPER_ADMIN"]}>
                <Suspense fallback={<RouteLoadingState />}><DailyRoster /></Suspense>
              </RoleGuard>
            } 
          />
        </Route>

        {/* HR OPERATIONS */}
        <Route 
          path="employees" 
          element={
            <RoleGuard roles={["DEPARTMENT_MANAGER", "HR_ADMIN", "SUPER_ADMIN"]}>
              <Suspense fallback={<RouteLoadingState />}><EmployeesPage /></Suspense>
            </RoleGuard>
          } 
        />
        <Route
          path="payroll"
          element={
            <RoleGuard roles={["HR_ADMIN", "SUPER_ADMIN"]}>
              <Suspense fallback={<RouteLoadingState />}><AdminPayroll /></Suspense>
            </RoleGuard>
          }
        />
        <Route
          path="bulk-ops"
          element={
            <RoleGuard roles={["HR_ADMIN", "SUPER_ADMIN"]}>
              <Suspense fallback={<RouteLoadingState />}><AdminBulkOps /></Suspense>
            </RoleGuard>
          }
        />

        {/* SYSTEM SETTINGS */}
        <Route
          path="settings"
          element={
            <RoleGuard roles={["SUPER_ADMIN"]}>
              <Suspense fallback={<RouteLoadingState />}><SettingsPage /></Suspense>
            </RoleGuard>
          }
        />

        {/* LEGACY / COMPATIBILITY (Removed) */}
        
      </Route>
      <Route path="/admin/*" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
