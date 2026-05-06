import { useState } from "react";
import { type Holiday } from "../../../api/settings";
import { DatePickerField } from "../../../components/ui/DatePickerField";
import { PencilLine, Trash2 } from "lucide-react";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { AppModal } from "../../../components/ui/AppModal";
import { useAppToast } from "../../../components/ui/ToastProvider";
import { useHolidays, useCreateHoliday, useUpdateHoliday, useDeleteHoliday } from "../../../hooks/queries/useSettings";

export default function HolidaysTab() {
  const { pushToast } = useAppToast();
  const { data: holidays = [], isLoading } = useHolidays();
  const createMutation = useCreateHoliday();
  const updateMutation = useUpdateHoliday();
  const deleteMutation = useDeleteHoliday();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const handleSave = async (h: Holiday) => {
    if (h.id) {
      await updateMutation.mutateAsync({ id: h.id, holiday: h });
    } else {
      await createMutation.mutateAsync(h);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteMutation.mutateAsync(confirmDelete);
    setConfirmDelete(null);
  };

  const sorted = [...holidays].sort((a, b) =>
    new Date(a.holidayDate).getTime() - new Date(b.holidayDate).getTime()
  );

  return (
    <div className="p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Public Holidays</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage company holidays for the current year</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer flex-1 sm:flex-none text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95">
            Upload Excel
            <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  const { uploadHolidays } = await import('../../../api/holidays');
                  await uploadHolidays(file);
                  pushToast({
                    tone: "success",
                    title: "Holiday file uploaded",
                    message: "The holiday calendar has been refreshed successfully.",
                  });
                  const { queryClient } = await import('../../../lib/queryClient');
                  queryClient.invalidateQueries({ queryKey: ['settings', 'holidays'] });
                } catch {
                  pushToast({
                    tone: "error",
                    title: "Holiday upload failed",
                    message: "Please check the file format and try again.",
                  });
                }
              }
            }} />
          </label>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold
              rounded-lg shadow-sm transition-all active:scale-95"
          >
            + Add Holiday
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading holidays...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No holidays configured.</div>
      ) : (
        <div className="grid gap-2">
          {sorted.map((h) => {
            const d = new Date(h.holidayDate + "T00:00:00");
            const isPast = d < new Date(new Date().toISOString().split("T")[0] + "T00:00:00");
            return (
              <div key={h.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors
                  ${isPast
                    ? "bg-gray-50/50 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800/50 opacity-60"
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">
                      {d.toLocaleDateString("en-IN", { month: "short" })}
                    </span>
                    <span className="text-base font-bold text-indigo-600 dark:text-indigo-300 leading-none">
                      {d.getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{h.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {d.toLocaleDateString("en-IN", { weekday: "long", year: "numeric" })}
                      {h.description && ` · ${h.description}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditing(h); setShowForm(true); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Edit Holiday"
                  >
                    <PencilLine size={16} />
                  </button>
                  <button
                    onClick={() => h.id && setConfirmDelete(h.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete Holiday"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <HolidayFormModal
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Holiday"
        message="Are you sure you want to delete this holiday? It will be removed from the company calendar."
      />
    </div>
  );
}

function HolidayFormModal({ initial, onSave, onClose, isSaving }: {
  initial: Holiday | null;
  onSave: (h: Holiday) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<Holiday>(initial ?? {
    name: "",
    holidayDate: new Date().toISOString().split("T")[0],
    description: "",
  });

  const handleSubmit = () => {
    onSave(form);
  };

  return (
    <AppModal
      isOpen={true}
      onClose={onClose}
      title={initial ? "Edit Holiday" : "New Holiday"}
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button onClick={onClose} className="text-sm font-semibold text-gray-500">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !form.name.trim()}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold
              rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : initial ? "Update" : "Create"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
              rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            placeholder="e.g. Independence Day"
          />
        </div>
        <div>
          <DatePickerField
            label="Date"
            value={form.holidayDate}
            onChange={(v) => setForm({ ...form, holidayDate: v })}
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
              rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            placeholder="Optional description"
          />
        </div>
      </div>
    </AppModal>
  );
}
