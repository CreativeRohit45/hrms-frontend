import { useState } from "react";
import { type Shift } from "../../../api/settings";
import { formatTime } from "../../../types/attendance";
import { TimePickerField, parseTimeToParts, to24hString } from "../../../components/ui/TimePickerField";
import { PencilLine, Trash2 } from "lucide-react";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { AppModal } from "../../../components/ui/AppModal";
import { useShifts, useCreateShift, useUpdateShift, useDeleteShift } from "../../../hooks/queries/useSettings";

export default function ShiftsTab() {
  const { data: shifts = [], isLoading } = useShifts();
  const createMutation = useCreateShift();
  const updateMutation = useUpdateShift();
  const deleteMutation = useDeleteShift();

  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const handleSave = async (shift: Shift) => {
    if (shift.id) {
      await updateMutation.mutateAsync({ id: shift.id, shift });
    } else {
      await createMutation.mutateAsync(shift);
    }
    setShowForm(false);
    setEditingShift(null);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteMutation.mutateAsync(confirmDelete);
    setConfirmDelete(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Work Shifts</h2>
          <p className="text-xs text-gray-500 mt-0.5">Define working hours for your organization</p>
        </div>
        <button
          onClick={() => { setEditingShift(null); setShowForm(true); }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold
            rounded-lg shadow-sm transition-all active:scale-95"
        >
          + Add Shift
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading shifts...</div>
      ) : shifts.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No shifts configured yet.</div>
      ) : (
        <>
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Name</th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Start (IST)</th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider py-3 px-4">End (IST)</th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Hours</th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Break</th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Grace</th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Status</th>
                <th className="text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                  <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{s.shiftName}</td>
                  <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-400">{formatTime(s.startTime)}</td>
                  <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-400">{formatTime(s.endTime)}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{s.standardHours}h</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{s.unpaidBreakMinutes}m</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{s.gracePeriodMinutes}m</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      s.active
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                    }`}>
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditingShift(s); setShowForm(true); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Edit Shift"
                      >
                        <PencilLine size={16} />
                      </button>
                      <button
                        onClick={() => s.id && setConfirmDelete(s.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete Shift"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card layout */}
        <div className="space-y-3 md:hidden">
          {shifts.map((s) => (
            <div key={s.id} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/20">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{s.shiftName}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      s.active
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                    }`}>
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-mono text-gray-500 dark:text-gray-400">
                    {formatTime(s.startTime)} → {formatTime(s.endTime)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditingShift(s); setShowForm(true); }}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <PencilLine size={16} />
                  </button>
                  <button
                    onClick={() => s.id && setConfirmDelete(s.id)}
                    className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white p-2.5 text-center dark:bg-gray-900">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Hours</p>
                  <p className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">{s.standardHours}h</p>
                </div>
                <div className="rounded-xl bg-white p-2.5 text-center dark:bg-gray-900">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Break</p>
                  <p className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">{s.unpaidBreakMinutes}m</p>
                </div>
                <div className="rounded-xl bg-white p-2.5 text-center dark:bg-gray-900">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Grace</p>
                  <p className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">{s.gracePeriodMinutes}m</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {showForm && (
        <ShiftFormModal
          initial={editingShift}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingShift(null); }}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Work Shift"
        message="Are you sure you want to delete this shift? Employees assigned to this shift may need to be reassigned."
      />
    </div>
  );
}

function ShiftFormModal({ initial, onSave, onClose, isSaving }: {
  initial: Shift | null;
  onSave: (s: Shift) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<Shift>(initial ?? {
    shiftName: "",
    startTime: "09:30:00",
    endTime: "18:30:00",
    unpaidBreakMinutes: 60,
    overnight: false,
    standardHours: 8,
    gracePeriodMinutes: 15,
    active: true,
  });

  const [startParts, setStartParts] = useState(parseTimeToParts(form.startTime));
  const [endParts, setEndParts] = useState(parseTimeToParts(form.endTime));

  const handleSubmit = () => {
    const finalShift = {
      ...form,
      startTime: to24hString(startParts),
      endTime: to24hString(endParts)
    };
    onSave(finalShift);
  };

  return (
    <AppModal
      isOpen={true}
      onClose={onClose}
      title={initial ? "Edit Shift" : "New Shift"}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button onClick={onClose} className="text-sm font-semibold text-gray-500">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !form.shiftName.trim()}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold
              rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : initial ? "Update Shift" : "Create Shift"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Shift Name</label>
          <input
            value={form.shiftName}
            onChange={(e) => setForm({ ...form, shiftName: e.target.value })}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
              rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            placeholder="e.g. General Shift"
          />
        </div>
        
        <div className="space-y-4">
          <TimePickerField label="Start Time (IST)" parts={startParts} setter={setStartParts} />
          <TimePickerField label="End Time (IST)" parts={endParts} setter={setEndParts} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Std Hours</label>
            <input
              type="number" step="0.5" min="1" max="24"
              value={form.standardHours}
              onChange={(e) => setForm({ ...form, standardHours: parseFloat(e.target.value) })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Break (min)</label>
            <input
              type="number" min="0" max="120"
              value={form.unpaidBreakMinutes}
              onChange={(e) => setForm({ ...form, unpaidBreakMinutes: parseInt(e.target.value) })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Grace (min)</label>
            <input
              type="number" min="0" max="60"
              value={form.gracePeriodMinutes}
              onChange={(e) => setForm({ ...form, gracePeriodMinutes: parseInt(e.target.value) })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        </div>
        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={form.overnight}
              onChange={(e) => setForm({ ...form, overnight: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Overnight shift
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Active
          </label>
        </div>
      </div>
    </AppModal>
  );
}
