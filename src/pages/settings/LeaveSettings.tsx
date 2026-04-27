import { useState } from "react";
import {
  Settings,
  RotateCw,
  Plus,
  AlertCircle,
  ShieldCheck,
  Edit2,
  Scale,
  User,
  ChevronRight,
  Loader2
} from "lucide-react";
import { AppModal } from "../../components/ui/AppModal";
import { useAppToast } from "../../components/ui/ToastProvider";
import { SelectField } from "../../components/ui/SelectField";
import {
  useLeaveTypes,
  useAdminLeaveTypes,
  useCreateLeaveType,
  useUpdateLeaveType,
  useOverrideBalance,
  useRunAccrual,
} from "../../hooks/queries/useLeaves";
import type { LeaveTypeDTO } from "../../types/leave";

export default function LeaveSettings() {
  const { pushToast } = useAppToast();

  // ── Data Layer ──────────────────────────────────────────────────
  const { data: activeTypes = [], isLoading: activeLoading } = useLeaveTypes();
  const { data: adminTypes = [], isLoading: adminLoading } = useAdminLeaveTypes();

  const accrualMutation = useRunAccrual();
  const accrualLoading = accrualMutation.isPending;

  const [modalState, setModalState] = useState<{
    mode: "CREATE" | "EDIT" | "OVERRIDE" | "NONE";
    selectedType?: LeaveTypeDTO;
  }>({ mode: "NONE" });


  const handleRunAccrual = async () => {
    if (!confirm("This will trigger the monthly leave credit for all active employees. Continue?")) return;
    try {
      await accrualMutation.mutateAsync();
      pushToast({ title: "Accrual Complete", message: "Monthly leave credits processed.", tone: "success" });
    } catch (err: any) {
      pushToast({
        title: "Accrual Failed",
        message: err?.response?.data?.message || "Already run today.",
        tone: "error"
      });
    }
  };

  const loading = activeLoading || adminLoading;

  if (loading) return <div className="p-12 animate-pulse font-mono flex items-center justify-center text-gray-400">Loading Configuration...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Settings className="text-indigo-500" size={28} />
            Leave Engine Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Configure accrual logic, policies, and manual triggers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Global Triggers */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 border-l-4 border-indigo-600 bg-white dark:bg-gray-900 shadow-sm rounded-3xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Accrual Engine</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <RotateCw size={20} className={accrualLoading ? "animate-spin" : ""} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold dark:text-white">Manual Run</h4>
                    <p className="text-[10px] text-gray-500 font-medium">Trigger monthly credits now</p>
                  </div>
                </div>
                <button
                  onClick={handleRunAccrual}
                  disabled={accrualLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                  {accrualLoading ? "Processing..." : "Execute Accrual"}
                </button>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/10 rounded-2xl border border-amber-100 dark:border-amber-900/40">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="text-amber-600 mt-1 flex-shrink-0" size={18} />
                  <div>
                    <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400">Idempotency Guard</h4>
                    <p className="text-[10px] text-amber-700 dark:text-amber-500/80 mt-1 leading-relaxed">
                      Only one accrual can run per 24h cycle to prevent ghost credits.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-emerald-600 bg-white dark:bg-gray-900 shadow-sm rounded-3xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Ledger Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setModalState({ mode: "OVERRIDE" })}
                className="w-full group flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-800/40 transition-all hover:translate-x-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Scale size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-emerald-800 dark:text-emerald-400">Manual Override</p>
                    <p className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-tight">Adjust existing balances</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Leave Types List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden bg-white dark:bg-gray-900 shadow-sm rounded-3xl border border-gray-100 dark:border-gray-800">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/20">
              <h3 className="font-black dark:text-white text-sm uppercase tracking-widest text-gray-400">Policy Buckets</h3>
              <button
                onClick={() => setModalState({ mode: "CREATE" })}
                className="px-5 py-2.5 bg-gray-900 dark:bg-indigo-600 text-white rounded-2xl text-xs font-black flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gray-900/10"
              >
                <Plus size={16} strokeWidth={3} /> NEW POLICY
              </button>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {adminTypes.map((t) => (
                <div key={t.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-black text-xs text-indigo-500 shadow-inner">
                      {t.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-black text-gray-900 dark:text-white text-sm tracking-tight">{t.name}</p>
                        <span className={`inline-flex px-1.5 py-0.5 rounded-lg text-[8px] font-black tracking-tighter border ${t.active ? "text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800/50" : "text-gray-400 border-gray-200 bg-gray-50 dark:text-gray-500 dark:border-gray-700 dark:bg-gray-800"
                          }`}>
                          {t.active ? "ACTIVE" : "DISABLED"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 tabular-nums uppercase">
                        <span>{t.defaultAnnualQuota}d Limit</span>
                        <span className="opacity-30">•</span>
                        <span>{t.paid ? "Paid" : "Unpaid"}</span>
                        <span className="opacity-30">•</span>
                        <span className="text-indigo-400">+{t.monthlyAccrualRate}/mo</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setModalState({ mode: "EDIT", selectedType: t })}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-indigo-500 transition-all active:scale-90 opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ────────────────────────────────────────────────── */}
      {modalState.mode === "OVERRIDE" && (
        <AdjustBalanceModal
          onClose={() => setModalState({ mode: "NONE" })}
          onSuccess={() => setModalState({ mode: "NONE" })}
          activeTypes={activeTypes}
        />
      )}

      {(modalState.mode === "CREATE" || modalState.mode === "EDIT") && (
        <LeaveTypeModal
          mode={modalState.mode}
          type={modalState.selectedType}
          onClose={() => setModalState({ mode: "NONE" })}
          onSuccess={() => setModalState({ mode: "NONE" })}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sub-Component: LeaveTypeModal
// ─────────────────────────────────────────────────────────────────
function LeaveTypeModal({ mode, type, onClose, onSuccess }: any) {
  const { pushToast } = useAppToast();
  const createMutation = useCreateLeaveType();
  const updateMutation = useUpdateLeaveType();

  const [formData, setFormData] = useState<Partial<LeaveTypeDTO>>(
    type || {
      name: "",
      code: "",
      paid: true,
      active: true,
      defaultAnnualQuota: 12,
      monthlyAccrualRate: 1,
      requiresAttachment: false,
      allowNegativeBalance: false,
      carryForwardAllowed: false,
      maxCarryForwardDays: 0
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "CREATE") {
        await createMutation.mutateAsync(formData);
      } else {
        await updateMutation.mutateAsync({ id: type.id, data: formData });
      }
      pushToast({ title: "Updated", message: "Leave policy saved successfully.", tone: "success" });
      onSuccess();
    } catch (err: any) {
      pushToast({ title: "Error", message: err.response?.data?.message || "Operation failed", tone: "error" });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AppModal isOpen title={mode === "CREATE" ? "New Leave Policy" : "Edit Policy Bucket"} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6 pb-6 pt-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Bucket Name</label>
            <input
              required
              className="w-full h-12 rounded-2xl border border-gray-100 bg-gray-50 px-4 text-sm font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Annual Leave"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Unique Code</label>
            <input
              required
              className="w-full h-12 rounded-2xl border border-gray-100 bg-gray-50 px-4 text-sm font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g. AL"
              disabled={mode === "EDIT"}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Annual Quota</label>
            <input
              type="number" step="0.5"
              className="w-full h-12 rounded-2xl border border-gray-100 bg-gray-50 px-4 text-sm font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none"
              value={formData.defaultAnnualQuota}
              onChange={e => setFormData({ ...formData, defaultAnnualQuota: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Monthly Accrual</label>
            <input
              type="number" step="0.1"
              className="w-full h-12 rounded-2xl border border-gray-100 bg-gray-50 px-4 text-sm font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none"
              value={formData.monthlyAccrualRate}
              onChange={e => setFormData({ ...formData, monthlyAccrualRate: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-1 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          {[
            { label: "Is Paid", field: "paid" },
            { label: "Is Active", field: "active" },
            { label: "Allow Negative", field: "allowNegativeBalance" },
            { label: "Requires Docs", field: "requiresAttachment" }
          ].map(opt => (
            <button
              key={opt.field}
              type="button"
              onClick={() => setFormData({ ...formData, [opt.field]: !((formData as any)[opt.field]) })}
              className={`flex items-center justify-between p-3 rounded-xl transition-all ${(formData as any)[opt.field]
                  ? "bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                  : "text-gray-400"
                }`}
            >
              <span className="text-[10px] font-black uppercase tracking-tight">{opt.label}</span>
              <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${(formData as any)[opt.field] ? "bg-indigo-500 border-indigo-500" : "border-gray-300 dark:border-gray-600"
                }`} />
            </button>
          ))}
        </div>

        <button
          disabled={isPending}
          className="w-full py-4 bg-gray-900 dark:bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
        >
          {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Commit Policy Changes"}
        </button>
      </form>
    </AppModal>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sub-Component: AdjustBalanceModal
// ─────────────────────────────────────────────────────────────────
function AdjustBalanceModal({ onClose, onSuccess, activeTypes }: any) {
  const { pushToast } = useAppToast();
  const overrideMutation = useOverrideBalance();

  const [form, setForm] = useState({
    employeeId: "",
    leaveTypeId: activeTypes[0]?.id || "",
    amount: "0",
    reason: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(form.amount) === 0) return pushToast({ title: "Invalid", message: "Amount cannot be zero", tone: "info" });

    try {
      await overrideMutation.mutateAsync({
        employeeId: Number(form.employeeId),
        leaveTypeId: Number(form.leaveTypeId),
        amount: Number(form.amount),
        reason: form.reason
      });
      pushToast({ title: "Override Success", message: "Ledger updated successfully.", tone: "success" });
      onSuccess();
    } catch (err: any) {
      pushToast({ title: "Error", message: err.response?.data?.message || "Adjustment failed", tone: "error" });
    }
  };

  return (
    <AppModal isOpen title="Manual Ledger Override" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6 pb-6 pt-2">
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/50 flex gap-3">
          <AlertCircle className="text-rose-600 flex-shrink-0" size={20} />
          <div>
            <p className="text-xs font-black text-rose-800 dark:text-rose-400 uppercase tracking-widest">Permanent Override</p>
            <p className="text-[10px] text-rose-700 dark:text-rose-500/80 mt-1">
              This will bypass eligibility checks and directly modify the employee's balance. Every change is tracked.
            </p>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Target Employee ID</label>
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              required
              type="number"
              className="w-full h-12 rounded-2xl border border-gray-100 bg-gray-50 pl-11 pr-4 text-sm font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none"
              placeholder="System ID (e.g. 42)"
              value={form.employeeId}
              onChange={e => setForm({ ...form, employeeId: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <SelectField
              label="Leave Category"
              value={String(form.leaveTypeId)}
              onChange={(v) => setForm({ ...form, leaveTypeId: v })}
              options={activeTypes.map((t: any) => ({ label: t.name, value: String(t.id) }))}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Adjustment (+/-)</label>
            <input
              required
              type="number" step="0.5"
              className="w-full h-12 rounded-2xl border border-gray-100 bg-gray-50 px-4 text-sm font-bold tabular-nums dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Audit Reason</label>
          <textarea
            required
            rows={3}
            className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none resize-none"
            placeholder="Mandatory explanation for this override..."
            value={form.reason}
            onChange={e => setForm({ ...form, reason: e.target.value })}
          />
        </div>

        <button
          disabled={overrideMutation.isPending}
          className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
        >
          {overrideMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Execute Ledger Adjustment"}
        </button>
      </form>
    </AppModal>
  );
}