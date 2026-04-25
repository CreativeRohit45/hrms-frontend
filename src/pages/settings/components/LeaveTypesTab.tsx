import { useState } from "react";
import { PencilLine, Trash2, Check, X } from "lucide-react";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { AppModal } from "../../../components/ui/AppModal";
import { useLeaveTypes, useCreateLeaveType, useUpdateLeaveType, useDeleteLeaveType } from "../../../hooks/queries/useSettings";
import type { LeaveType } from "../../../api/settings";

export default function LeaveTypesTab() {
  const { data: leaveTypes = [], isLoading } = useLeaveTypes();
  const createMutation = useCreateLeaveType();
  const updateMutation = useUpdateLeaveType();
  const deleteMutation = useDeleteLeaveType();

  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const handleSave = async (lt: LeaveType) => {
    try {
      if (lt.id) {
        await updateMutation.mutateAsync({ id: lt.id, lt });
      } else {
        await createMutation.mutateAsync(lt);
      }
      setShowForm(false);
      setEditingType(null);
    } catch (err) {
      console.error("Failed to save leave type", err);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMutation.mutateAsync(confirmDelete);
      setConfirmDelete(null);
    } catch (err) {
      console.error("Failed to delete leave type", err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Leave Types</h2>
          <p className="text-xs text-gray-500 mt-0.5">Configure entitlement rules and accrual settings</p>
        </div>
        <button
          onClick={() => { setEditingType(null); setShowForm(true); }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold
            rounded-lg shadow-sm transition-all active:scale-95"
        >
          + Add Leave Type
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading leave types...</div>
      ) : leaveTypes.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No leave types configured yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Name & Code</th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Quota</th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Paid</th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Accrual</th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Carry Fwd</th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Status</th>
                <th className="text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveTypes.map((lt) => (
                <tr key={lt.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-gray-900 dark:text-white">{lt.name}</p>
                    <p className="text-[10px] font-mono text-gray-400">{lt.code}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{lt.defaultAnnualQuota}d</span>
                    <p className="text-[10px] text-gray-400">per year</p>
                  </td>
                  <td className="py-3 px-4">
                    {lt.paid ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                        <Check size={12} /> PAID
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                        <X size={12} /> UNPAID
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-gray-600 dark:text-gray-400">{lt.monthlyAccrualRate}d / mo</p>
                  </td>
                  <td className="py-3 px-4">
                    {lt.carryForwardAllowed ? (
                      <p className="text-gray-600 dark:text-gray-400 font-medium">Up to {lt.maxCarryForwardDays}d</p>
                    ) : (
                      <p className="text-gray-400 italic">No</p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      lt.active
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                    }`}>
                      {lt.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditingType(lt); setShowForm(true); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-indigo-600 transition-colors"
                      >
                        <PencilLine size={16} />
                      </button>
                      <button
                        onClick={() => lt.id && setConfirmDelete(lt.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-colors"
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
        <LeaveTypeFormModal
          initial={editingType}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingType(null); }}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Leave Type"
        message="Are you sure you want to deactivate this leave type? Existing requests will not be deleted but new ones cannot be created."
      />
    </div>
  );
}

function LeaveTypeFormModal({ initial, onSave, onClose, isSaving }: {
  initial: LeaveType | null;
  onSave: (lt: LeaveType) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<LeaveType>(initial ?? {
    name: "",
    code: "",
    paid: true,
    requiresAttachment: false,
    attachmentThresholdDays: 0,
    requiresProbationCompletion: false,
    allowNegativeBalance: false,
    defaultAnnualQuota: 12,
    monthlyAccrualRate: 1,
    carryForwardAllowed: false,
    maxCarryForwardDays: 0,
    active: true,
  });

  return (
    <AppModal
      isOpen={true}
      onClose={onClose}
      title={initial ? "Edit Leave Type" : "New Leave Type"}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button onClick={onClose} className="text-sm font-semibold text-gray-500">Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={isSaving || !form.name.trim() || !form.code.trim()}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold
              rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : initial ? "Update Type" : "Create Type"}
          </button>
        </div>
      }
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Display Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              placeholder="e.g. Sick Leave"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Code</label>
            <input
              value={form.code}
              disabled={!!initial}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
              placeholder="e.g. SICK_LEAVE"
            />
          </div>
        </div>

        {/* Quota & Accrual */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl space-y-4 border border-gray-100 dark:border-gray-700/50">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Entitlement & Accrual</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Annual Quota (Days)</label>
              <input
                type="number"
                value={form.defaultAnnualQuota}
                onChange={(e) => setForm({ ...form, defaultAnnualQuota: parseFloat(e.target.value) })}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
                  rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Monthly Accrual Credit</label>
              <input
                type="number"
                value={form.monthlyAccrualRate}
                onChange={(e) => setForm({ ...form, monthlyAccrualRate: parseFloat(e.target.value) })}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
                  rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Rules & Guards */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Guardrails & Rules</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={form.paid}
                onChange={(e) => setForm({ ...form, paid: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600"
              />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Paid Leave</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={form.requiresAttachment}
                onChange={(e) => setForm({ ...form, requiresAttachment: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600"
              />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Requires Attachment</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={form.carryForwardAllowed}
                onChange={(e) => setForm({ ...form, carryForwardAllowed: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600"
              />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Carry Forward Allowed</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={form.allowNegativeBalance}
                onChange={(e) => setForm({ ...form, allowNegativeBalance: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600"
              />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Allow Negative Balance</span>
            </label>
          </div>
        </div>

        {/* Conditional inputs */}
        {(form.requiresAttachment || form.carryForwardAllowed) && (
          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800 pt-4 animate-in slide-in-from-top-2 duration-200">
            {form.requiresAttachment && (
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Attachment Threshold (Days)</label>
                <input
                  type="number"
                  value={form.attachmentThresholdDays}
                  onChange={(e) => setForm({ ...form, attachmentThresholdDays: parseInt(e.target.value) })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                    rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            )}
            {form.carryForwardAllowed && (
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Max Carry Forward (Days)</label>
                <input
                  type="number"
                  value={form.maxCarryForwardDays}
                  onChange={(e) => setForm({ ...form, maxCarryForwardDays: parseInt(e.target.value) })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                    rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600"
            />
            Status: {form.active ? "Active" : "Inactive"}
          </label>
        </div>
      </div>
    </AppModal>
  );
}
