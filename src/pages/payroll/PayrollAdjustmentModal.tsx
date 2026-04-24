import { useState, useMemo } from "react";
import { 
  X, Plus, AlertTriangle, 
  IndianRupee, Info, Save, Lock
} from "lucide-react";
import { addAdjustment } from "../../api/payroll";
import type { PayslipResponse, AdjustmentType } from "../../types/payroll";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: PayslipResponse;
  onSuccess: () => void;
}

const ADJ_TYPES: { value: AdjustmentType; label: string; positive: boolean }[] = [
  { value: "BONUS", label: "Bonus / Performance Reward", positive: true },
  { value: "ARREARS", label: "Arrears / Back Pay", positive: true },
  { value: "DEDUCTION_DAMAGE", label: "Deduction (Damage/Loss)", positive: false },
  { value: "DEDUCTION_OTHER", label: "Deduction (Other)", positive: false },
];

export default function PayrollAdjustmentModal({ isOpen, onClose, record, onSuccess }: Props) {
  const [type, setType] = useState<AdjustmentType>("BONUS");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("");
  const [confirmLarge, setConfirmLarge] = useState(false);
  const [loading, setLoading] = useState(false);

  // Logical Guard: Is the amount unusually large? (> Base Salary)
  const isUnusuallyLarge = useMemo(() => {
    const val = parseFloat(amount) || 0;
    return val > record.grossPay;
  }, [amount, record.grossPay]);

  // Projected Net Pay calculation
  const projectNetPay = useMemo(() => {
    const val = parseFloat(amount) || 0;
    const isPositive = ADJ_TYPES.find(t => t.value === type)?.positive;
    return isPositive ? record.netPay + val : record.netPay - val;
  }, [amount, type, record.netPay]);

  const handleAdd = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (isUnusuallyLarge && !confirmLarge) return;

    setLoading(true);
    try {
      await addAdjustment(record.recordId, type, parseFloat(amount), description);
      setAmount("");
      setDescription("");
      setConfirmLarge(false);
      onSuccess(); // Triggers parent refresh
    } catch (error) {
      console.error("Failed to add adjustment", error);
    } finally {
      setLoading(false);
    }
  };


  if (!isOpen) return null;

  const isLocked = record.status === "LOCKED" || record.status === "PAID";

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-950 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/30">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              Adjust Payroll: <span className="text-indigo-600 dark:text-indigo-400">{record.fullName}</span>
            </h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
              Period: {record.period} • Status: {record.status}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* Summary Banner */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Current Net Pay</p>
              <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">₹{record.netPay.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Projected Net Pay</p>
              <p className={`text-2xl font-black ${projectNetPay > record.netPay ? 'text-emerald-600' : 'text-rose-600'}`}>
                ₹{projectNetPay.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Add New Adjustment Form */}
          {!isLocked ? (
            <div className="space-y-4 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus size={16} className="text-indigo-500" />
                Add New Adjustment
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Type</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value as AdjustmentType)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    {ADJ_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Amount (₹)</label>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className={`w-full bg-white dark:bg-gray-800 border rounded-xl px-4 py-2.5 text-sm font-black dark:text-white outline-none focus:ring-2 transition-all ${
                      isUnusuallyLarge ? 'border-amber-400 ring-amber-400/20' : 'border-gray-200 dark:border-gray-700 focus:ring-indigo-500/20'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description / Reason</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why is this being added?"
                  rows={2}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Large Amount Warning */}
              {isUnusuallyLarge && (
                <div className="flex flex-col gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl">
                  <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
                    <AlertTriangle size={20} />
                    <p className="text-xs font-bold uppercase tracking-tight">Unusually Large Adjustment</p>
                  </div>
                  <p className="text-[11px] text-amber-600 dark:text-amber-500 font-medium">
                    This amount exceeds the employee's gross salary. Please verify before adding.
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={confirmLarge}
                      onChange={(e) => setConfirmLarge(e.target.checked)}
                      className="rounded-md border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-200 group-hover:underline">
                      I confirm this amount is intentional
                    </span>
                  </label>
                </div>
              )}

              <button 
                onClick={handleAdd}
                disabled={loading || !amount || (isUnusuallyLarge && !confirmLarge)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Injecting Ledger..." : (
                  <>
                    <Save size={18} />
                    Apply Adjustment
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex items-center gap-4">
              <Lock className="text-amber-500" size={24} />
              <div>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200 leading-tight">Record Locked</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Adjustments cannot be added to finalized payroll.</p>
              </div>
            </div>
          )}

          {/* Ledger History (Soft Deletes Not Visible) */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Info size={16} className="text-gray-400" />
              Adjustment History
            </h3>
            
            <div className="space-y-3">
               {/* Note: In a real app we'd fetch this from the record.adjustments object we added to PayslipResponse 
                  For now we show the summary from the response fields if any */}
               {record.totalAdjustmentAmount === 0 ? (
                 <div className="py-8 text-center text-gray-400 italic text-sm">
                   No manual adjustments applied to this record.
                 </div>
               ) : (
                 <div className="space-y-2">
                    {record.adjustmentBonus > 0 && <AdjustmentItem label="Bonus" amount={record.adjustmentBonus} type="POSITIVE" />}
                    {record.adjustmentArrears > 0 && <AdjustmentItem label="Arrears" amount={record.adjustmentArrears} type="POSITIVE" />}
                    {record.adjustmentDeductionDamage > 0 && <AdjustmentItem label="Damage Deduction" amount={record.adjustmentDeductionDamage} type="NEGATIVE" />}
                    {record.adjustmentDeductionOther > 0 && <AdjustmentItem label="Other Deduction" amount={record.adjustmentDeductionOther} type="NEGATIVE" />}
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}

function AdjustmentItem({ label, amount, type }: { label: string, amount: number, type: 'POSITIVE' | 'NEGATIVE' }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl">
       <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${type === 'POSITIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <IndianRupee size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{label}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Applied to Ledger</p>
          </div>
       </div>
       <p className={`text-sm font-black ${type === 'POSITIVE' ? 'text-emerald-500' : 'text-rose-500'}`}>
         {type === 'POSITIVE' ? '+' : '-'}₹{amount.toLocaleString()}
       </p>
    </div>
  );
}
