import { useState } from "react";
import { AppModal } from "../ui/AppModal";
import { useAppToast } from "../ui/ToastProvider";
import { useApplyGatepass } from "../../hooks/queries/useGatepasses";
import { FormLabel, FormTextarea, SubmitButton, PillToggle } from "../forms/FormPrimitives";
import { TimePickerField, parseTimeToParts, to24hString } from "../ui/TimePickerField";

export function GatepassApplyModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    outTime: parseTimeToParts("13:00"),
    inTime: parseTimeToParts("14:00"),
    gatepassType: "OFFICIAL" as "OFFICIAL" | "PERSONAL",
    reason: "",
  });
  const { pushToast } = useAppToast();
  const applyMutation = useApplyGatepass();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use today's date since backend requires an active session
    const today = new Date().toISOString().split('T')[0];
    
    const payload = {
      gatepassType: form.gatepassType,
      reason: form.reason,
      requestedOutTime: `${today}T${to24hString(form.outTime)}`,
      requestedInTime: `${today}T${to24hString(form.inTime)}`,
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
      <form onSubmit={handleSubmit} className="space-y-6 pb-4 pt-2">

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

        {/* Time pickers - Same as Regularization */}
        <div className="space-y-5">
          <TimePickerField 
            label="Exit Time" 
            parts={form.outTime} 
            setter={(v) => setForm({ ...form, outTime: v })} 
          />
          <TimePickerField 
            label="Return Time" 
            parts={form.inTime} 
            setter={(v) => setForm({ ...form, inTime: v })} 
          />
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
        <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-gray-100 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-1 sm:backdrop-blur-0">
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
