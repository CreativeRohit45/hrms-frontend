import axios, { 
  type AxiosInstance, 
  type InternalAxiosRequestConfig, 
  type AxiosResponse, 
  type AxiosError 
} from "axios";

const BASE_URL = "";
export const TOKEN_KEY = "hrms_auth_user";

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

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

apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError): Promise<never> => {
    const isLoginRequest = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = "/login?expired=true";
    }
    return Promise.reject(error);
  }
);

export default apiClient;