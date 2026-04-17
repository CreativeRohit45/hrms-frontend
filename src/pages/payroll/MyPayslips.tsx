// src/pages/payroll/MyPayslips.tsx
import { useState, useEffect } from "react";
import { 
  FileText, Eye, Calendar, 
  ShieldCheck, Printer, X 
} from "lucide-react";
import { getMyPayslips, getPayslipDetail } from "../../api/payroll";
import type { PayslipResponse } from "../../types/payroll";

export default function MyPayslips() {
  const [payslips, setPayslips] = useState<PayslipResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await getMyPayslips();
      setPayslips(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch payslips", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (recordId: number) => {
    setDetailLoading(true);
    try {
      const detail = await getPayslipDetail(recordId);
      setSelectedPayslip(detail);
    } catch (err) {
      console.error("Failed to fetch detail", err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            My Payslips
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View and download your historical earnings and deductions.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          ))}
        </div>
      ) : (!Array.isArray(payslips) || payslips.length === 0) ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-16 flex flex-col items-center gap-4 opacity-50">
          <FileText size={48} className="text-gray-400" />
          <p className="text-gray-500 font-bold">No payslips found in your history.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(payslips) && payslips.map((slip: PayslipResponse) => (
            <div 
              key={slip.recordId}
              className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-600">
                  <Calendar size={20} />
                </div>
                <div className={`
                  px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter
                  ${slip.status === 'LOCKED' || slip.status === 'PAID' 
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' 
                    : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30'}
                `}>
                  {slip.status === 'LOCKED' ? 'READY' : slip.status}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                  {slip.period}
                </p>
                <p className="text-xs text-gray-400 font-medium">Monthly Statement</p>
              </div>

              <div className="my-6 border-t border-dashed border-gray-200 dark:border-gray-800 pt-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Net Payout</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                      ₹{slip.netPay.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleViewDetails(slip.recordId)}
                className="w-full py-3 bg-gray-50 dark:bg-gray-800/80 hover:bg-indigo-600 hover:text-white text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white"
              >
                {detailLoading && selectedPayslip?.recordId === slip.recordId ? "Opening..." : (
                  <>
                    <Eye size={16} /> View Details
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Premium Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setSelectedPayslip(null)} />
          
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-300 no-scrollbar">
            
            {/* Modal Header Controls (Hidden on Print) */}
            <div className="sticky top-0 right-0 p-6 flex justify-end gap-3 z-10 print:hidden">
              <button 
                onClick={() => window.print()}
                className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors shadow-sm"
                title="Print Payslip"
              >
                <Printer size={18} />
              </button>
              <button 
                onClick={() => setSelectedPayslip(null)}
                className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-rose-500 transition-colors shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-10 pt-4 print:p-0 print:m-0 print:w-full">
              {/* Document Layout */}
              <style>{`
                @media print {
                  @page { size: auto; margin: 20mm; }
                  body * { visibility: hidden; }
                  .print-document, .print-document * { visibility: visible; }
                  .print-document { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
                  .print-hidden { display: none !important; }
                }
              `}</style>
              <div className="space-y-10 print-document">
                
                {/* Brand & Period */}
                <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">CoreSync HRMS</h2>
                      <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-0.5">PAYSLIP GENERATED ELECTRONICALLY</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedPayslip.period}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">RECORD ID: #{selectedPayslip.recordId}</p>
                  </div>
                </div>

                {/* Employee Info Header */}
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Employee Information</h4>
                    <div className="space-y-1">
                      <p className="text-lg font-black text-gray-900 dark:text-white leading-none">{selectedPayslip.fullName}</p>
                      <p className="text-xs text-gray-500 font-medium">{selectedPayslip.designation}</p>
                      <p className="text-xs text-gray-400">{selectedPayslip.departmentName}</p>
                      <p className="text-xs font-mono text-indigo-500 mt-2 font-bold">{selectedPayslip.employeeCode}</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-right">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Attendance Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-right">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold leading-none">PRESENT DAYS</p>
                        <p className="text-base font-black text-gray-800 dark:text-gray-200">{selectedPayslip.presentDays}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold leading-none">ABSENCE / LWP</p>
                        <p className="text-base font-black text-rose-500">{selectedPayslip.absentDays}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Breakdown Table */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                  <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-800">
                    
                    {/* EARNINGS */}
                    <div className="p-6">
                      <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Earnings</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Regular Component</span>
                          <span className="font-bold text-gray-900 dark:text-white">₹{selectedPayslip.grossPay.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 dark:text-gray-400 text-xs">Arrears / Other</span>
                          <span className="font-bold text-gray-900 dark:text-white">₹0</span>
                        </div>
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-3 flex justify-between items-center">
                          <span className="text-sm font-black text-emerald-600">Total Earnings</span>
                          <span className="font-black text-emerald-600">₹{selectedPayslip.grossPay.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* DEDUCTIONS */}
                    <div className="p-6">
                      <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-4">Deductions</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Provident Fund (PF)</span>
                          <span className="font-bold text-gray-900 dark:text-white text-rose-500">₹{selectedPayslip.deductionPf.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 dark:text-gray-400 text-xs">Professional Tax / TDS</span>
                          <span className="font-bold text-gray-900 dark:text-white text-rose-500">₹{selectedPayslip.deductionTds.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 dark:text-gray-400 text-xs text-amber-500 font-bold italic">ESI / Insurance</span>
                          <span className="font-bold text-gray-900 dark:text-white text-rose-400">₹{selectedPayslip.deductionEsi.toLocaleString()}</span>
                        </div>
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-3 flex justify-between items-center text-rose-600">
                          <span className="text-sm font-black uppercase">Total Deductions</span>
                          <span className="font-black">₹{selectedPayslip.totalDeductions.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Net Payout Banner */}
                <div className="bg-indigo-600 p-8 rounded-2xl shadow-xl shadow-indigo-600/30 flex justify-between items-center text-white">
                  <div>
                    <h3 className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Net Payable Amount</h3>
                    <p className="text-sm italic opacity-80">(Amount credited to registered bank account)</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-4xl font-black tracking-tight">₹{selectedPayslip.netPay.toLocaleString()}</h2>
                  </div>
                </div>

                {/* Footer Notes */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-8 pb-4 opacity-50">
                  <p className="text-[10px] leading-relaxed italic text-gray-500 dark:text-gray-400">
                    * This is a computer generated document and does not require a signature. Any discrepancies in attendance or pay components 
                    should be reported to the HR department within 48 hours of payslip receipt. All amounts are in INR.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
