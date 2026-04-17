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
import LeavesPage from "./pages/leaves/index";
import GatepassPage from "./pages/gatepasses/index";
import AdminPayroll from "./pages/payroll/AdminPayroll";
import MyPayslips from "./pages/payroll/MyPayslips";

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

function RoleGuard({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
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
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* MY SPACE */}
        <Route path="profile" element={<Profile />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="requests" element={<MyRequests />} />
        <Route path="my-payslips" element={<MyPayslips />} />

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

        {/* SYSTEM SETTINGS */}
        <Route
          path="settings"
          element={
            <RoleGuard roles={["SUPER_ADMIN"]}>
              <SettingsPage />
            </RoleGuard>
          }
        />

        {/* LEGACY / COMPATIBILITY (Optional: leave existing paths for direct links) */}
        <Route path="leaves" element={<LeavesPage />} />
        <Route path="gatepasses" element={<GatepassPage />} />
        
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
