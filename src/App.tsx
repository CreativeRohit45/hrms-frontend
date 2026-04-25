// src/App.tsx
import React from "react";
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
import EmployeesPage from "./pages/employees/index";
import AttendancePage from "./pages/attendance/index";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import SettingsPage from "./pages/settings/SettingsPage";
import AdminPayroll from "./pages/payroll/AdminPayroll";
import MyPayslips from "./pages/payroll/MyPayslips";
import AdminBulkOps from "./pages/admin/AdminBulkOps";

// NEW INTENT-BASED PAGES
import UnifiedInbox from "./pages/team/UnifiedInbox";
import DailyRoster from "./pages/team/DailyRoster";
import MyRequests from "./pages/my-space/MyRequests";

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
              <AttendancePage />
            </RoleGuard>
          } 
        />
        <Route 
          path="requests" 
          element={
            <RoleGuard roles={["EMPLOYEE", "HR_ADMIN", "DEPARTMENT_MANAGER"]} fallback="/app/team/inbox">
              <MyRequests />
            </RoleGuard>
          } 
        />
        <Route 
          path="my-payslips" 
          element={
            <RoleGuard roles={["EMPLOYEE", "HR_ADMIN", "DEPARTMENT_MANAGER"]} fallback="/app/team/inbox">
              <MyPayslips />
            </RoleGuard>
          } 
        />

        {/* TEAM SPACE */}
        <Route path="team">
          <Route 
            path="inbox" 
            element={
              <RoleGuard roles={["DEPARTMENT_MANAGER", "HR_ADMIN", "SUPER_ADMIN"]}>
                <UnifiedInbox />
              </RoleGuard>
            } 
          />
          <Route 
            path="roster" 
            element={
              <RoleGuard roles={["DEPARTMENT_MANAGER", "HR_ADMIN", "SUPER_ADMIN"]}>
                <DailyRoster />
              </RoleGuard>
            } 
          />
        </Route>

        {/* HR OPERATIONS */}
        <Route 
          path="employees" 
          element={
            <RoleGuard roles={["DEPARTMENT_MANAGER", "HR_ADMIN", "SUPER_ADMIN"]}>
              <EmployeesPage />
            </RoleGuard>
          } 
        />
        <Route
          path="payroll"
          element={
            <RoleGuard roles={["HR_ADMIN", "SUPER_ADMIN"]}>
              <AdminPayroll />
            </RoleGuard>
          }
        />
        <Route
          path="bulk-ops"
          element={
            <RoleGuard roles={["HR_ADMIN", "SUPER_ADMIN"]}>
              <AdminBulkOps />
            </RoleGuard>
          }
        />

        {/* SYSTEM SETTINGS */}
        <Route
          path="settings"
          element={
            <RoleGuard roles={["SUPER_ADMIN"]}>
              <SettingsPage />
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
