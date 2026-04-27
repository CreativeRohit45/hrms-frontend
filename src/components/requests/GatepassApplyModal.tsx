import { useState } from "react";
import { AppModal } from "../ui/AppModal";
import { useAppToast } from "../ui/ToastProvider";
import { useApplyGatepass } from "../../hooks/queries/useGatepasses";
import { FormLabel, FormTextarea, DateTimeInput, SubmitButton, PillToggle } from "../forms/FormPrimitives";
import { DatePickerField } from "../ui/DatePickerField";

export function GatepassApplyModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    date: "",
    outTime: "",
    inTime: "",
    gatepassType: "OFFICIAL" as "OFFICIAL" | "PERSONAL",
    reason: "",
  });
  const { pushToast } = useAppToast();
  const applyMutation = useApplyGatepass();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.outTime || !form.inTime) {
      pushToast({ title: "Validation Error", message: "Date and times are required.", tone: "error" });
      return;
    }
    const payload = {
      gatepassType: form.gatepassType,
      reason: form.reason,
      requestedOutTime: `${form.date}T${form.outTime}`,
      requestedInTime: `${form.date}T${form.inTime}`,
    };

    try {
      await applyMutation.mutateAsync(payload as any);
      pushToast({ title: "Success", message: "Gatepass request sent!", tone: "success" });
      onSuccess();
    } catch (err: any) {
      pushToast({ title: "Error", message: err.response?.data?.message || "Failed to submit", tone: "error" });
    }
  };

  return (
    <AppModal isOpen={true} onClose={onClose} title="Request Gatepass" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5 pb-4 pt-2">

        {/* Pass type */}
        <div>
          <FormLabel>Pass Type</FormLabel>
          <PillToggle<"OFFICIAL" | "PERSONAL">
            value={form.gatepassType}
            onChange={(v) => setForm({ ...form, gatepassType: v })}
            activeColor="orange"
            options={[
              { label: "Official", value: "OFFICIAL", icon: <span>🏢</span> },
              { label: "Personal", value: "PERSONAL", icon: <span>🙋</span> },
            ]}
          />
        </div>

        {/* Date Picker */}
        <div>
          <DatePickerField
            label="Date"
            required
            value={form.date}
            onChange={(v) => setForm({ ...form, date: v })}
          />
        </div>

        {/* Time pickers */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Exit Time</FormLabel>
            <div className="relative flex items-center">
              <input
                type="time"
                required
                value={form.outTime}
                onChange={(e) => setForm({ ...form, outTime: e.target.value })}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base sm:text-sm font-semibold text-gray-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-gray-800 dark:[color-scheme:dark]"
              />
            </div>
          </div>
          <div>
            <FormLabel>Return Time</FormLabel>
            <div className="relative flex items-center">
              <input
                type="time"
                required
                value={form.inTime}
                onChange={(e) => setForm({ ...form, inTime: e.target.value })}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base sm:text-sm font-semibold text-gray-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-gray-800 dark:[color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Reason */}
        <div>
          <FormLabel>Reason</FormLabel>
          <FormTextarea
            required
            rows={3}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Details about your transit…"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-1">
          <SubmitButton
            isPending={applyMutation.isPending}
            label="Submit Gatepass Request"
            pendingLabel="Sending…"
            color="orange"
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
