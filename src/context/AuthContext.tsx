import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import apiClient, { TOKEN_KEY } from "../api/axios";
import type { AuthUser, LoginRequest, LoginResponse } from "../types/auth";
import { getSystemInfo } from "../api/system";
import { initServerClock } from "../utils/serverTime";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  payrollLockDate: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;

  try {
    const parsed: AuthUser = JSON.parse(raw);
    if (parsed?.accessToken && parsed?.employeeCode) {
      return parsed;
    }
  } catch {
    // Ignore invalid local session payloads.
  }

  localStorage.removeItem(TOKEN_KEY);
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [payrollLockDate, setPayrollLockDate] = useState<string | null>(null);

  const fetchSystemData = useCallback(async () => {
    try {
      const info = await getSystemInfo();
      initServerClock(info.serverTime);
      setPayrollLockDate(info.payrollLockDate);
    } catch (err) {
      console.error("[System Sync] Failed to fetch system info", err);
    }
  }, []);

  useEffect(() => {
    void fetchSystemData().finally(() => setIsLoading(false));
  }, [fetchSystemData]);

  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    const response = await apiClient.post<LoginResponse>("/api/v1/auth/login", credentials);
    const data = response.data;
    const authUser: AuthUser = {
      accessToken: data.accessToken,
      employeeCode: data.employeeCode,
      fullName: data.fullName,
      role: data.role,
      expiresInMs: data.expiresInMs,
    };
    localStorage.setItem(TOKEN_KEY, JSON.stringify(authUser));
    setUser(authUser);
    await fetchSystemData();
  }, [fetchSystemData]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading, login, logout, payrollLockDate }),
    [user, isLoading, login, logout, payrollLockDate]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
