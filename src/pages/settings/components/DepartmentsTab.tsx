import { useState } from "react";
import { type Department } from "../../../api/settings";
import { PencilLine, Trash2 } from "lucide-react";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { AppModal } from "../../../components/ui/AppModal";
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from "../../../hooks/queries/useSettings";

export default function DepartmentsTab() {
  const { data: departments = [], isLoading, error } = useDepartments();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const [localError, setLocalError] = useState<string | null>(null);

  const handleSave = async (dept: Department) => {
    setLocalError(null);
    try {
      if (dept.id) {
        await updateMutation.mutateAsync({ id: dept.id, dept });
      } else {
        await createMutation.mutateAsync(dept);
      }
      setShowForm(false);
      setEditing(null);
    } catch (err: any) {
      setLocalError(err.response?.data?.message || err.message || "Failed to save department.");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setLocalError(null);
    try {
      await deleteMutation.mutateAsync(confirmDelete);
      setConfirmDelete(null);
    } catch (err: any) {
      setLocalError(err.response?.data?.message || err.message || "Failed to delete department.");
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

      {(error || localError) && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {(error as any)?.response?.data?.message || (error as Error)?.message || localError}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading departments...</div>
      ) : departments.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No departments configured.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div key={dept.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900 dark:text-white">{dept.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                  dept.active ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                }`}>
                  {dept.active ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                {dept.description || "No description provided."}
              </p>
              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity pt-4 border-t border-gray-50 dark:border-gray-800/50">
                <button
                  onClick={() => { setEditing(dept); setShowForm(true); }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  <PencilLine size={16} />
                </button>
                <button
                  onClick={() => dept.id && setConfirmDelete(dept.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
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
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Department"
        message="Are you sure? Removing a department might affect employee associations. Proceed with caution."
      />
    </div>
  );
}

function DepartmentFormModal({ initial, onSave, onClose, isSaving }: {
  initial: Department | null;
  onSave: (d: Department) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<Department>(initial ?? {
    name: "",
    description: "",
    active: true,
  });

  const handleSubmit = () => {
    onSave(form);
  };

  return (
    <AppModal
      isOpen={true}
      onClose={onClose}
      title={initial ? "Edit Department" : "New Department"}
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
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Department Name</label>
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
              rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[100px] resize-none"
            placeholder="What does this department do?"
          />
        </div>
        <div className="pt-2">
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
