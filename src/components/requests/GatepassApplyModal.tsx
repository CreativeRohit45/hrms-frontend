import { useState } from "react";
import { AppModal } from "../ui/AppModal";
import { useAppToast } from "../ui/ToastProvider";
import { useApplyGatepass } from "../../hooks/queries/useGatepasses";
import { FormLabel, FormTextarea, DateTimeInput, SubmitButton, PillToggle } from "../forms/FormPrimitives";

export function GatepassApplyModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    requestedOutTime: "",
    requestedInTime: "",
    gatepassType: "OFFICIAL" as "OFFICIAL" | "PERSONAL",
    reason: "",
  });
  const { pushToast } = useAppToast();
  const applyMutation = useApplyGatepass();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await applyMutation.mutateAsync(form as any);
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

        {/* Time pickers — stacked on mobile, side-by-side sm+ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FormLabel>Exit Time</FormLabel>
            <DateTimeInput
              required
              value={form.requestedOutTime}
              onChange={(e) => setForm({ ...form, requestedOutTime: e.target.value })}
            />
          </div>
          <div>
            <FormLabel>Return Time</FormLabel>
            <DateTimeInput
              required
              value={form.requestedInTime}
              onChange={(e) => setForm({ ...form, requestedInTime: e.target.value })}
            />
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
