import { useState, useEffect, useCallback } from "react";
import {
  getShifts, createShift, updateShift, deleteShift,
  getHolidays, createHoliday, updateHoliday, deleteHoliday,
  getLocations, updateLocation,
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  type Shift, type Holiday, type CompanyLocation, type Department,
} from "../../api/settings";
import { formatTime } from "../../types/attendance";
import { TimePickerField, parseTimeToParts, to24hString } from "../../components/ui/TimePickerField";
import { DatePickerField } from "../../components/ui/DatePickerField";
import { PencilLine, Trash2 } from "lucide-react";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { useAppToast } from "../../components/ui/ToastProvider";

// ── Tab Config ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "shifts", label: "Shifts", icon: "🕐" },
  { id: "holidays", label: "Holidays", icon: "🎉" },
  { id: "company", label: "Company", icon: "🏢" },
  { id: "departments", label: "Departments", icon: "👥" },
] as const;

type TabId = typeof TABS[number]["id"];

// ── Weekend Days ──────────────────────────────────────────────────────────────
const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("shifts");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">System Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Manage shifts, holidays, company configuration, and departments
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all
              ${activeTab === tab.id
                ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
        {activeTab === "shifts" && <ShiftsTab />}
        {activeTab === "holidays" && <HolidaysTab />}
        {activeTab === "company" && <CompanyTab />}
        {activeTab === "departments" && <DepartmentsTab />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHIFTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function ShiftsTab() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setShifts(await getShifts()); } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (shift: Shift) => {
    try {
      if (shift.id) {
        await updateShift(shift.id, shift);
      } else {
        await createShift(shift);
      }
      setShowForm(false);
      setEditingShift(null);
      load();
    } catch { }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { 
      await deleteShift(confirmDelete); 
      setConfirmDelete(null);
      load(); 
    } catch { }
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

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading shifts...</div>
      ) : shifts.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No shifts configured yet.</div>
      ) : (
        <div className="overflow-x-auto">
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
      )}

      {showForm && (
        <ShiftFormModal
          initial={editingShift}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingShift(null); }}
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

function ShiftFormModal({ initial, onSave, onClose }: {
  initial: Shift | null;
  onSave: (s: Shift) => void;
  onClose: () => void;
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

  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    const finalShift = {
      ...form,
      startTime: to24hString(startParts),
      endTime: to24hString(endParts)
    };
    await onSave(finalShift);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800
        rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {initial ? "Edit Shift" : "New Shift"}
          </h3>
        </div>
        <div className="px-6 py-5 space-y-4">
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
          <div className="flex items-center gap-6">
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
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/40">
          <button onClick={onClose} className="text-sm font-semibold text-gray-500">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.shiftName.trim()}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold
              rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? "Saving..." : initial ? "Update Shift" : "Create Shift"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOLIDAYS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function HolidaysTab() {
  const { pushToast } = useAppToast();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setHolidays(await getHolidays()); } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (h: Holiday) => {
    try {
      if (h.id) {
        await updateHoliday(h.id, h);
      } else {
        await createHoliday(h);
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch { }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { 
      await deleteHoliday(confirmDelete); 
      setConfirmDelete(null);
      load(); 
    } catch { }
  };

  // Sort by date
  const sorted = [...holidays].sort((a, b) =>
    new Date(a.holidayDate).getTime() - new Date(b.holidayDate).getTime()
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Public Holidays</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage company holidays for the current year</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95">
            Upload Excel
            <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  const { uploadHolidays } = await import('../../api/holidays');
                  await uploadHolidays(file);
                  load();
                  pushToast({
                    tone: "success",
                    title: "Holiday file uploaded",
                    message: "The holiday calendar has been refreshed successfully.",
                  });
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
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold
              rounded-lg shadow-sm transition-all active:scale-95"
          >
            + Add Holiday
          </button>
        </div>
      </div>

      {loading ? (
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

function HolidayFormModal({ initial, onSave, onClose }: {
  initial: Holiday | null;
  onSave: (h: Holiday) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Holiday>(initial ?? {
    name: "",
    holidayDate: new Date().toISOString().split("T")[0],
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800
        rounded-2xl shadow-2xl w-full max-w-md overflow-visible relative">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {initial ? "Edit Holiday" : "New Holiday"}
          </h3>
        </div>
        <div className="px-6 py-5 space-y-4">
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
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onClose} className="text-sm font-semibold text-gray-500">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.name.trim()}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold
              rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? "Saving..." : initial ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPANY TAB
// ═══════════════════════════════════════════════════════════════════════════════
function CompanyTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CompanyLocation | null>(null);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const locs = await getLocations();
      if (locs.length > 0) setForm(locs[0]);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form || !form.id) return;
    setSaving(true);
    try {
      await updateLocation(form.id, form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      load();
    } catch { }
    setSaving(false);
  };

  const toggleWeekend = (day: string) => {
    if (!form) return;
    const current = form.weekendDays.split(",").map(d => d.trim()).filter(Boolean);
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];
    setForm({ ...form, weekendDays: updated.join(",") });
  };

  if (loading) return <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>;
  if (!form) return <div className="p-6 text-center text-gray-400 text-sm">No company location configured.</div>;

  const weekends = form.weekendDays.split(",").map(d => d.trim());

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Company Location</h2>
        <p className="text-xs text-gray-500 mt-0.5">Update your office details and geofence settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Location Name</label>
          <input
            value={form.locationName}
            onChange={(e) => setForm({ ...form, locationName: e.target.value })}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
              rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Address</label>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
              rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Latitude</label>
          <input
            type="number" step="0.0000001"
            value={form.latitude}
            onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
              rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Longitude</label>
          <input
            type="number" step="0.0000001"
            value={form.longitude}
            onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
              rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Geofence Radius (m)</label>
          <input
            type="number" min="100" max="50000"
            value={form.allowedRadiusMeters}
            onChange={(e) => setForm({ ...form, allowedRadiusMeters: parseInt(e.target.value) })}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
              rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      {/* Weekend Days */}
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Weekend Days</label>
        <div className="flex flex-wrap gap-2">
          {ALL_DAYS.map((day) => (
            <button
              key={day}
              onClick={() => toggleWeekend(day)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all
                ${weekends.includes(day)
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
        {success && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Saved successfully
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold
            rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEPARTMENTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function DepartmentsTab() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { 
      const data = await getDepartments();
      setDepartments(data); 
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load departments.");
      console.error("Fetch depts failed:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (dept: Department) => {
    setError(null);
    try {
      if (dept.id) await updateDepartment(dept.id, dept);
      else await createDepartment(dept);
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to save department.");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setError(null);
    try { 
      await deleteDepartment(confirmDelete); 
      setConfirmDelete(null);
      load(); 
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to delete department.");
      setConfirmDelete(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Departments</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage organizational departments</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold
            rounded-lg shadow-sm transition-all active:scale-95"
        >
          + Add Department
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading departments...</div>
      ) : departments.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No departments configured.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <div key={d.id} className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl relative group">
              <h3 className="font-semibold text-gray-900 dark:text-white">{d.name}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{d.description || "No description"}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.active ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}>
                  {d.active ? "Active" : "Inactive"}
                </span>
                <div className="flex items-center gap-1 transition-opacity">
                  <button
                    onClick={() => { setEditing(d); setShowForm(true); }}
                    className="p-1.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-gray-400 hover:text-indigo-600 transition-all shadow-sm active:scale-90"
                    title="Edit Department"
                  >
                    <PencilLine size={16} />
                  </button>
                  <button
                    onClick={() => d.id && setConfirmDelete(d.id)}
                    className="p-1.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-all shadow-sm active:scale-90"
                    title="Delete Department"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <DepartmentFormModal
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Department"
        message="Are you sure you want to delete this department? This action cannot be undone."
      />
    </div>
  );
}

function DepartmentFormModal({ initial, onSave, onClose }: {
  initial: Department | null;
  onSave: (d: Department) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Department>(initial ?? {
    name: "",
    description: "",
    active: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800
        rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {initial ? "Edit Department" : "New Department"}
          </h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              placeholder="e.g. Engineering"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
              placeholder="Overview of this department"
              rows={3}
            />
          </div>
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
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onClose} className="text-sm font-semibold text-gray-500">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.name.trim()}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold
              rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? "Saving..." : initial ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}


