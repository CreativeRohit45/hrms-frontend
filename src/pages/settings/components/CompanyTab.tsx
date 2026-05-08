import { useState, useEffect } from "react";
import { type CompanyLocation } from "../../../api/settings";
import { useCompanyLocation, useUpdateLocation } from "../../../hooks/queries/useSettings";

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function CompanyTab() {
  const { data: locations = [], isLoading } = useCompanyLocation();
  const updateMutation = useUpdateLocation();

  const [form, setForm] = useState<CompanyLocation | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (locations.length > 0 && !form) {
      setForm(locations[0]);
    }
  }, [locations, form]);

  const handleSave = async () => {
    if (!form || !form.id) return;
    await updateMutation.mutateAsync({ id: form.id, loc: form });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const toggleWeekend = (day: string) => {
    if (!form) return;
    const current = form.weekendDays.split(",").map(d => d.trim()).filter(Boolean);
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];
    setForm({ ...form, weekendDays: updated.join(",") });
  };

  if (isLoading) return <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>;
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

      <div className="flex flex-row items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800/60">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Strict Geofence Enforcement</h3>
          <p className="text-xs text-gray-500 mt-0.5 pr-2">If enabled, punch-in/out from outside the allowed radius will be blocked.</p>
        </div>
        <button
          onClick={() => setForm({ ...form, enforceGeofence: !form.enforceGeofence })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            form.enforceGeofence ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              form.enforceGeofence ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
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
          disabled={updateMutation.isPending}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold
            rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
