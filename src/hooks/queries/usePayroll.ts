// src/hooks/queries/usePayroll.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
import { 
  getMyPayslips, 
  getPayslipDetail,
  downloadPayslip 
} from "../../api/payroll";

// Extrapolating the key factory specifically for payroll
export const payrollKeys = {
  all: ["payroll"] as const,
  my: () => [...payrollKeys.all, "my"] as const,
  company: (month: number, year: number) => [...payrollKeys.all, "company", month, year] as const,
  detail: (recordId: number) => [...payrollKeys.all, "detail", recordId] as const,
};

// Hook for fetching an employee's own payslip history
export function useMyPayslips() {
  return useQuery({
    queryKey: payrollKeys.my(),
    queryFn: getMyPayslips,
  });
}

// Hook for fetching a single payslip's details
export function usePayslipDetail(recordId: number | null) {
  return useQuery({
    queryKey: payrollKeys.detail(recordId!),
    queryFn: () => getPayslipDetail(recordId!),
    enabled: !!recordId,
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
      // Depending on your error handling library you might toast the error here
    }
  });
}
