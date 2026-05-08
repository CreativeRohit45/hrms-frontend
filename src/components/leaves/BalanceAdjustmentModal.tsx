import { useState, useEffect } from "react";
import { ConfirmModal } from "../ui/ConfirmModal";
import { AppModal } from "../ui/AppModal";
import { SelectField } from "../ui/SelectField";
import type { LeaveBalanceResponse } from "../../types/leave";
import { useGrantLeave, useOverrideBalance, useRunAccrual } from "../../hooks/queries/useLeaves";

export function BalanceAdjustmentModal({
  employeeId,
  balances,
  onClose,
  onSuccess,
}: {
  employeeId: number;
  balances: LeaveBalanceResponse[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<"GRANT" | "OVERRIDE">("GRANT");
  const [leaveTypeId, setLeaveTypeId] = useState(balances[0]?.leaveTypeId || 0);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [showAccrualConfirm, setShowAccrualConfirm] = useState(false);

  const selectedBalance = balances.find((b) => b.leaveTypeId === leaveTypeId);
  const isHours = selectedBalance?.unit === "HOURS";

  // Sync leaveTypeId when balances arrive
  useEffect(() => {
    if (balances.length > 0 && leaveTypeId === 0) {
      setLeaveTypeId(balances[0].leaveTypeId);
    }
  }, [balances, leaveTypeId]);

  const grantMutation = useGrantLeave();
  const overrideMutation = useOverrideBalance();
  const accrualMutation = useRunAccrual();

  const isSubmitting = grantMutation.isPending || overrideMutation.isPending;

  const handleApply = async () => {
    if (!leaveTypeId || !amount || !reason) return;
    try {
      if (mode === "GRANT") {
        await grantMutation.mutateAsync({ employeeId, leaveTypeId, amount: Number(amount), reason });
      } else {
        await overrideMutation.mutateAsync({ employeeId, leaveTypeId, amount: Number(amount), reason });
      }
      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccrual = async () => {
    try {
      await accrualMutation.mutateAsync();
      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <AppModal isOpen={true} onClose={onClose} title="Balance Management" size="md">
        <div className="space-y-6 py-2">
          <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            <button
              onClick={() => setMode("GRANT")}
              className={`flex-1 rounded-lg py-2 text-[10px] font-black uppercase tracking-widest transition-all ${mode === "GRANT" ? "bg-white text-indigo-600 shadow-sm dark:bg-gray-900" : "text-gray-400"}`}
            >
              Credit/Debit
            </button>
            <button
              onClick={() => setMode("OVERRIDE")}
              className={`flex-1 rounded-lg py-2 text-[10px] font-black uppercase tracking-widest transition-all ${mode === "OVERRIDE" ? "bg-white text-indigo-600 shadow-sm dark:bg-gray-900" : "text-gray-400"}`}
            >
              Hard Override
            </button>
          </div>

          <div className="space-y-4">
            <SelectField
              label="Leave Category"
              value={String(leaveTypeId)}
              onChange={(v) => setLeaveTypeId(Number(v))}
              options={balances.map((b) => ({ label: `${b.leaveTypeCode} · ${b.leaveTypeName}`, value: String(b.leaveTypeId) }))}
            />

            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                {mode === "GRANT" 
                  ? `Adjustment Amount (${isHours ? "Hours" : "Days"})` 
                  : `New Balance Value (${isHours ? "Hours" : "Days"})`}
              </label>
              <input
                type="number"
                step="0.1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={mode === "GRANT" ? (isHours ? "e.g. 2.5 or -1.0" : "e.g. 1.5 or -1.0") : (isHours ? "e.g. 8.0" : "e.g. 15.0")}
                className="h-12 w-full rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm font-mono font-black dark:border-gray-800 dark:bg-gray-900"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-gray-400">Justification / Audit Note</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm font-medium dark:border-gray-800 dark:bg-gray-900"
                placeholder="Why is this change being made?"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleApply}
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-indigo-600 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95"
            >
              {isSubmitting ? "Updating Ledger..." : "Commit Transaction"}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100 dark:border-gray-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 dark:bg-gray-900 dark:text-gray-700">
                  Danger Zone
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowAccrualConfirm(true)}
              disabled={accrualMutation.isPending}
              className="w-full rounded-xl border border-amber-200 py-3 text-[10px] font-black uppercase tracking-widest text-amber-600 transition-all hover:bg-amber-600 hover:text-white"
            >
              {accrualMutation.isPending ? "Running Engine..." : "Trigger Global Accrual Run"}
            </button>
          </div>
        </div>
      </AppModal>
      <ConfirmModal
        isOpen={showAccrualConfirm}
        onClose={() => setShowAccrualConfirm(false)}
        onConfirm={handleAccrual}
        title="Trigger Global Accrual"
        message="This runs the leave accrual engine for all employees and writes ledger entries. Continue only if you have verified the payroll/leave period."
        confirmText="Run Accrual"
        requireConfirmText="ACCRUAL"
        isDestructive={true}
      />
    </>
  );
}
