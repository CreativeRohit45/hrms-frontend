import { useState } from "react";
import { AlertCircle, ChevronDown, Loader2, SunDim, Sunset } from "lucide-react";
import { AppModal } from "../ui/AppModal";
import { useAppToast } from "../ui/ToastProvider";
import { useLeaveTypes, useApplyLeave, useLeavePreview } from "../../hooks/queries/useLeaves";
import { fieldBase, FormLabel, FormTextarea, DateInput, SubmitButton, PillToggle } from "../forms/FormPrimitives";

export function LeaveApplyModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: types = [] } = useLeaveTypes();
  const [form, setForm] = useState<{
    leaveTypeId: number;
    startDate: string;
    endDate: string;
    reason: string;
    halfDay: boolean;
    halfType: "FIRST" | "SECOND";
  }>({ leaveTypeId: 0, startDate: "", endDate: "", reason: "", halfDay: false, halfType: "FIRST" });
  const { pushToast } = useAppToast();
  const applyMutation = useApplyLeave();

  // ── Live Balance Preview Logic ──────────────────────────────────
  const { data: preview, isFetching: previewLoading } = useLeavePreview({
    leaveTypeId: form.leaveTypeId,
    startDate: form.startDate,
    endDate: form.endDate,
    halfDay: form.halfDay,
    halfDaySession: form.halfType === "FIRST" ? "FIRST_HALF" : "SECOND_HALF",
  });

  const isInsufficient = (preview?.balanceAfterDeduction ?? 0) < 0 && !types.find((t: any) => t.id === form.leaveTypeId)?.allowNegativeBalance;
  const canSubmit = !isInsufficient && !previewLoading && form.startDate && form.endDate && form.leaveTypeId !== 0;

  // Auto-select first leave type when types load
  if (form.leaveTypeId === 0 && types.length > 0) {
    setForm((f) => ({ ...f, leaveTypeId: types[0].id }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await applyMutation.mutateAsync(form);
      pushToast({ title: "Success", message: "Leave applied successfully!", tone: "success" });
      onSuccess();
    } catch (err: any) {
      pushToast({ title: "Error", message: err.response?.data?.message || "Failed to apply", tone: "error" });
    }
  };

  return (
    <AppModal isOpen={true} onClose={onClose} title="Apply for Leave" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5 pb-4 pt-2">

        {/* Leave type — h-12 via fieldBase keeps it same height as inputs */}
        <div>
          <FormLabel>Leave Type</FormLabel>
          <div className="relative">
            <select
              value={form.leaveTypeId}
              onChange={(e) => setForm({ ...form, leaveTypeId: Number(e.target.value) })}
              className={`${fieldBase} appearance-none pr-10`}
            >
              {types.map((t: any) => (
                <option key={t.id} value={t.id} className="dark:bg-gray-900">
                  {t.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Date range — stacked on mobile, side-by-side sm+ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FormLabel>Start Date</FormLabel>
            <DateInput
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
          <div>
            <FormLabel>End Date</FormLabel>
            <DateInput
              required
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
        </div>

        {/* Half day toggle row */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60">
          <div className="flex min-h-[52px] items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Half Day</p>
              <p className="text-xs text-gray-400">Single-day leaves only</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, halfDay: !form.halfDay })}
              aria-checked={form.halfDay}
              role="switch"
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${form.halfDay ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-600"
                }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ${form.halfDay ? "translate-x-5" : "translate-x-0"
                  }`}
              />
            </button>
          </div>

          {/* Expanded half-type picker — slides in when halfDay is true */}
          {form.halfDay && (
            <div className="border-t border-gray-200 px-4 pb-4 pt-3 dark:border-gray-700">
              <p className="mb-2.5 text-xs font-bold text-gray-500 dark:text-gray-400">
                Which half?
              </p>
              <PillToggle<"FIRST" | "SECOND">
                value={form.halfType}
                onChange={(v) => setForm({ ...form, halfType: v })}
                activeColor="indigo"
                options={[
                  {
                    label: "First Half",
                    value: "FIRST",
                    icon: <SunDim className="h-4 w-4" />,
                  },
                  {
                    label: "Second Half",
                    value: "SECOND",
                    icon: <Sunset className="h-4 w-4" />,
                  },
                ]}
              />
            </div>
          )}
        </div>

        {/* ── Balance Preview Card (Apple Receipt Style) ─────────────── */}
        {(form.startDate && form.endDate && preview) && (
          <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
            isInsufficient 
              ? "border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20" 
              : "border-indigo-100 bg-indigo-50/30 dark:border-indigo-900/30 dark:bg-indigo-950/10"
          }`}>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                <span>Application preview</span>
                {previewLoading && <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />}
              </div>
              
              <div className="space-y-2 font-medium">
                <div className="flex justify-between items-center tabular-nums text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Current Balance</span>
                  <span className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{preview.currentBalance.toFixed(1)} Days</span>
                </div>
                <div className="flex justify-between items-center tabular-nums text-sm">
                  <span className="text-gray-500 dark:text-gray-400 text-xs text-indigo-600/70">Deduction</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 tracking-tighter">-{preview.appliedDays.toFixed(1)} Days</span>
                </div>
                
                <div className="pt-2 mt-2 border-t border-dashed border-gray-200 dark:border-gray-700/50 flex justify-between items-center tabular-nums">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-400">Projected Balance</span>
                  <span className={`text-lg font-black tracking-tighter ${isInsufficient ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {preview.balanceAfterDeduction.toFixed(1)}
                    <span className="text-[10px] ml-1 uppercase">Days</span>
                  </span>
                </div>
              </div>

              {isInsufficient && (
                <div className="flex gap-2 items-start mt-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-900/40 border border-rose-100 dark:border-rose-800">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-500 mt-0.5" />
                  <p className="text-[10px] font-bold text-rose-700 dark:text-rose-300 leading-tight">
                    Insufficient balance for this leave type.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reason */}
        <div>
          <FormLabel>Reason</FormLabel>
          <FormTextarea
            required
            rows={3}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Brief details about your leave..."
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-1">
          <SubmitButton
            isPending={applyMutation.isPending || previewLoading}
            disabled={!canSubmit}
            label={isInsufficient ? "Insufficient Balance" : "Apply for Leave"}
            pendingLabel={previewLoading ? "Calculating..." : "Submitting…"}
            color={isInsufficient ? "orange" : "indigo"}
          />
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[48px] rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-500 transition-all hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Discard
          </button>
        </div>
      </form>
    </AppModal>
  );
}
