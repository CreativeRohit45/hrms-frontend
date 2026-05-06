import axios, { 
  type AxiosInstance, 
  type InternalAxiosRequestConfig, 
  type AxiosResponse, 
  type AxiosError 
} from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "";
export const TOKEN_KEY = "hrms_auth_user";

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ═══════════════════════════════════════════════════════════════════
//  REQUEST INTERCEPTOR — Attach access token to every request
// ═══════════════════════════════════════════════════════════════════

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (raw) {
      try {
        const authUser = JSON.parse(raw);
        if (authUser?.accessToken && !config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${authUser.accessToken}`;
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ═══════════════════════════════════════════════════════════════════
//  RESPONSE INTERCEPTOR — Silent token refresh with concurrency lock
//
//  When multiple requests fail with 401 simultaneously (common on
//  page load), only ONE refresh request is fired. All other failing
//  requests are queued and retried once the new token arrives.
//
//  This prevents the "401 Data Wipe" where form data was destroyed
//  on token expiry, and avoids the race condition of multiple
//  concurrent refresh calls consuming each other's tokens.
// ═══════════════════════════════════════════════════════════════════

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeToTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function onRefreshFailed() {
  refreshSubscribers.forEach((_cb) => {/* reject silently — redirect handles cleanup */});
  refreshSubscribers = [];
}

apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: AxiosError): Promise<any> => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't intercept login or refresh requests themselves
    const isAuthRequest = originalRequest?.url?.includes("/auth/login") 
      || originalRequest?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && !isAuthRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // Another request is already refreshing — queue this one
        return new Promise((resolve) => {
          subscribeToTokenRefresh((newToken: string) => {
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      // This is the FIRST 401 — initiate refresh
      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const raw = localStorage.getItem(TOKEN_KEY);
        const authUser = raw ? JSON.parse(raw) : null;
        const refreshToken = authUser?.refreshToken;

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Call the refresh endpoint
        const response = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        // Update stored tokens
        const updatedUser = { ...authUser, accessToken: newAccessToken, refreshToken: newRefreshToken };
        localStorage.setItem(TOKEN_KEY, JSON.stringify(updatedUser));

        // Retry the original request with new token
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        // Unblock all queued requests
        onTokenRefreshed(newAccessToken);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed — token is truly dead. Clean up and redirect.
        isRefreshing = false;
        onRefreshFailed();

        // Preserve the current URL so user can return after login
        sessionStorage.setItem("hrms_redirect_after_login", window.location.pathname);

        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("token");
        window.location.href = "/login?expired=true";
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;