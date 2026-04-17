import type { AxiosError } from "axios";

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorShape {
  status?: number;
  error?: string;
  message?: string;
  fields?: ApiFieldError[];
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  const apiError = error as AxiosError<ApiErrorShape>;
  return apiError.response?.data?.message || apiError.message || fallback;
}

export function getApiFieldErrors(error: unknown): ApiFieldError[] {
  const apiError = error as AxiosError<ApiErrorShape>;
  return apiError.response?.data?.fields || [];
}
