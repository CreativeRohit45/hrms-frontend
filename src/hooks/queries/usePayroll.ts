// ═══════════════════════════════════════════════════════════════════
//  usePayroll — Custom hooks for the Payroll module.
//  Queries: my payslips, payslip detail, company payroll.
//  Mutations: generate, lock, recalculate, adjustment, download.
// ═══════════════════════════════════════════════════════════════════

import { useQuery, useMutation, keepPreviousData } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
import { queryKeys } from "../../lib/queryKeys";
import { queryClient } from "../../lib/queryClient";
import {
  getMyPayslips,
  getPayslipDetail,
  downloadPayslip,
  getCompanyPayroll,
  generatePayrollBulk,
  lockPayroll,
  recalculateRecord,
  addAdjustment,
} from "../../api/payroll";
import type { PayslipResponse } from "../../types/payroll";

// ── Queries ──────────────────────────────────────────────────────

// Hook for fetching an employee's own payslip history
export function useMyPayslips() {
  return useQuery({
    queryKey: queryKeys.payroll.myPayslips(),
    queryFn: getMyPayslips,
  });
}

// Hook for fetching a single payslip's details
export function usePayslipDetail(recordId: number | null) {
  return useQuery({
    queryKey: ['payroll', 'detail', recordId!],
    queryFn: () => getPayslipDetail(recordId!),
    enabled: !!recordId,
  });
}

// Hook for fetching company-wide payroll for a given month/year.
// Uses keepPreviousData to prevent jarring table flashes when
// switching months — old data stays visible while new data loads.
export function useCompanyPayroll(month: number, year: number) {
  return useQuery<PayslipResponse[]>({
    queryKey: queryKeys.payroll.company(month, year),
    queryFn: () => getCompanyPayroll(month, year),
    placeholderData: keepPreviousData,
  });
}

// ── Cross-domain invalidation helper ─────────────────────────────

function invalidatePayrollEcosystem(month: number, year: number) {
  queryClient.invalidateQueries({ queryKey: queryKeys.payroll.company(month, year) });
  queryClient.invalidateQueries({ queryKey: queryKeys.payroll.myPayslips() });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
}

// ── Mutations ────────────────────────────────────────────────────

export function useGeneratePayrollBulk() {
  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) =>
      generatePayrollBulk(month, year),
    onSuccess: (_data, variables) => {
      invalidatePayrollEcosystem(variables.month, variables.year);
    },
  });
}

export function useLockPayroll() {
  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) =>
      lockPayroll(month, year),
    onSuccess: (_data, variables) => {
      // Cascading invalidation per architect directive:
      // 1. Refresh admin payroll grid
      invalidatePayrollEcosystem(variables.month, variables.year);
      // 2. Employee sees newly locked payslip
      queryClient.invalidateQueries({ queryKey: queryKeys.payroll.myPayslips() });
      // 3. Dashboard financial metrics
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });
}

export function useRecalculateRecord(month: number, year: number) {
  return useMutation({
    mutationFn: (recordId: number) => recalculateRecord(recordId),
    onSuccess: () => {
      invalidatePayrollEcosystem(month, year);
    },
  });
}

export function useAddAdjustment(month: number, year: number) {
  return useMutation({
    mutationFn: ({
      recordId,
      type,
      amount,
      description,
    }: {
      recordId: number;
      type: string;
      amount: number;
      description: string;
    }) => addAdjustment(recordId, type, amount, description),
    onSuccess: () => {
      invalidatePayrollEcosystem(month, year);
    },
  });
}

// Custom Hook: Download Native PDF Payslip
export function useDownloadPayslip() {
  return useMutation({
    mutationFn: downloadPayslip,
    onSuccess: (response: AxiosResponse<Blob>) => {
      // 1. Extract the filename from the content-disposition header if available
      let filename = 'payslip.pdf';
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // 2. We asked for responseType: 'blob', so response.data is the binary blob
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // 3. Create hidden anchor element to trigger browser download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      // 4. Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      console.error("Failed to download PDF payslip:", error);
    }
  });
}
