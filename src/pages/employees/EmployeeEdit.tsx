import React, { useState } from "react";
import {
  PAYMENT_TYPE_OPTIONS,
  ROLE_OPTIONS,
  type EmployeeFormState,
  type EmployeeStatus,
} from "../../types/employee";
import { DatePickerField } from "../../components/ui/DatePickerField";
import { SelectField } from "../../components/ui/SelectField";
import { 
  Palmtree, 
  FileText, 
  Clock, 
  ArrowDownCircle, 
  ArrowUpCircle,
  AlertCircle,
  UserCircle,
  ShieldCheck,
  Copy
} from "lucide-react";
import { useEmployeeBalances, useEmployeeAuditTrail, useEmployeeLeaveRequests } from "../../hooks/queries/useLeaves";
import { useEmployeeById, useUpdateEmployee } from "../../hooks/queries/useEmployees";
import { useDepartments, useShifts, useCompanyLocation } from "../../hooks/queries/useSettings";
import { BalanceAdjustmentModal } from "../../components/leaves/BalanceAdjustmentModal";

export default function EmployeeEdit({
  employeeId,
  onSuccess,
  onCancel,
}: {
  employeeId: number;
  onSuccess: (code: string) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<EmployeeFormState | null>(null);
  const [status, setStatus] = useState<EmployeeStatus | "">("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "leaves">("info");
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  // ── TanStack Query: declarative data layer ─────────────────────
  const { data: empData, isLoading: loading } = useEmployeeById(employeeId);
  const { data: depts = [] } = useDepartments();
  const { data: shifts = [] } = useShifts();
  const { data: locs = [] } = useCompanyLocation();
  const updateMutation = useUpdateEmployee();

  // Leave queries — only fire when the leaves tab is active
  const isLeavesTab = activeTab === "leaves";
  const { data: balances = [], isLoading: loadingBalances } = useEmployeeBalances(employeeId, isLeavesTab);
  const { data: auditsData, isLoading: loadingAudits, fetchNextPage: fetchMoreAudits, hasNextPage: hasMoreAudits, isFetchingNextPage: fetchingMoreAudits } = useEmployeeAuditTrail(employeeId, isLeavesTab);
  const audits = React.useMemo(() => auditsData?.pages.flatMap(p => p.content) || [], [auditsData]);
  const { data: leaveRequests = [], isLoading: loadingRequests } = useEmployeeLeaveRequests(employeeId, isLeavesTab);
  const loadingLeaves = loadingBalances || loadingAudits || loadingRequests;

  // Hydrate the form when empData arrives (one-time)
  React.useEffect(() => {
    if (empData && !form) {
      setForm({
        fullName: empData.fullName,
        phone: empData.phone || "",
        email: empData.email || "",
        dateOfBirth: empData.dateOfBirth || "",
        dateOfJoining: empData.dateOfJoining,
        departmentId: String(empData.departmentId),
        designation: empData.designation,
        shiftId: String(empData.shiftId),
        locationId: String(empData.locationId),
        paymentType: empData.paymentType,
        hourlyRate: String(empData.hourlyRate),
        overtimeRateMultiplier: String(empData.overtimeRateMultiplier),
        role: empData.role,
        baseSalary: empData.baseSalary !== null ? String(empData.baseSalary) : "",
        hraPercentage: empData.hraPercentage !== null ? String(empData.hraPercentage) : "40",
        pfPercentage: empData.pfPercentage !== null ? String(empData.pfPercentage) : "12",
        initialBalances: {},
      });
      setStatus(empData.status);
    }
  }, [empData]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    if (!form) return;
    setForm((prev) => ({ ...prev!, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !status) return;
    setApiError(null);
    try {
      const payload = {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        dateOfBirth: form.dateOfBirth || "",
        dateOfJoining: form.dateOfJoining,
        departmentId: Number(form.departmentId),
        designation: form.designation,
        shiftId: Number(form.shiftId),
        locationId: Number(form.locationId),
        paymentType: form.paymentType as any,
        hourlyRate: Number(form.hourlyRate),
        overtimeRateMultiplier: Number(form.overtimeRateMultiplier || 1.5),
        role: form.role as any,
        status: status as EmployeeStatus,
        baseSalary: Number(form.baseSalary) || 0,
        hraPercentage: Number(form.hraPercentage) || 40,
        pfPercentage: Number(form.pfPercentage) || 12,
      };

      const updated = await updateMutation.mutateAsync({ id: employeeId, data: payload });
      onSuccess(updated.employeeCode);
    } catch (err: any) {
      setApiError(err.response?.data?.message || "Failed to update employee.");
    }
  }

  const labelCls = "block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5";
  const copyLeaveStatement = async () => {
    if (!form) return;
    const summary = balances.map((b) => `${b.leaveTypeName}: ${b.balance}/${b.allocated} days`).join("\n");
    await navigator.clipboard.writeText(`Leave statement for ${form.fullName}\n${summary}`);
  };

  if (loading) return <div className="p-12 text-center text-gray-400 font-mono animate-pulse">Synchronizing Data...</div>;
  if (!form) return <div className="p-12 text-center text-red-500 font-bold">{apiError}</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 overflow-x-hidden pb-10 animate-in fade-in duration-500 sm:space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-gray-900 dark:text-white text-2xl font-black tracking-tight">Manage Professional Profile</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-black rounded uppercase tracking-tighter">ID: {employeeId}</span>
            <span className="text-gray-300 dark:text-gray-700">/</span>
            <span className="text-sm font-bold text-indigo-500">{form.fullName}</span>
          </div>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 transition-colors">
          <AlertCircle size={20} />
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex w-full items-center gap-1 overflow-x-auto rounded-2xl bg-gray-100 p-1.5 dark:bg-gray-800/40 sm:w-fit">
        <button 
          onClick={() => setActiveTab("info")}
          className={`group flex min-w-max flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-[11px] font-black uppercase tracking-widest transition-all duration-300 sm:flex-none sm:px-8 ${
            activeTab === "info" 
              ? "bg-white dark:bg-gray-900 text-indigo-600 shadow-md shadow-indigo-500/10" 
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          }`}
        >
          <UserCircle size={16} className={activeTab === "info" ? "text-indigo-500" : ""} />
          Basic Profile
        </button>
        <button 
          onClick={() => setActiveTab("leaves")}
          className={`group flex min-w-max flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-[11px] font-black uppercase tracking-widest transition-all duration-300 sm:flex-none sm:px-8 ${
            activeTab === "leaves" 
              ? "bg-white dark:bg-gray-900 text-indigo-600 shadow-md shadow-indigo-500/10" 
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          }`}
        >
          <Palmtree size={16} className={activeTab === "leaves" ? "text-indigo-500" : ""} />
          Leaves & Audit
        </button>
      </div>

      {activeTab === "info" && (
        <div className="card p-4 animate-in slide-in-from-left-4 duration-500 sm:p-8">
          {apiError && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl px-4 py-3 mb-8 text-rose-600 dark:text-rose-400 text-sm font-bold flex items-center gap-2">
              <AlertCircle size={18} /> {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10 text-xs">
            {/* Personal Details */}
            <section>
              <h3 className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest mb-6 border-b border-gray-100 dark:border-gray-800 pb-3">
                Profile Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className={labelCls}>Legal Full Name</label>
                  <input name="fullName" value={form.fullName} onChange={handleChange} className="input-base font-bold" required />
                </div>
                <div>
                  <label className={labelCls}>Contact Email</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} className="input-base font-bold" />
                </div>
                <div>
                  <label className={labelCls}>Phone Number</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="input-base font-bold" />
                </div>
                <div>
                  <DatePickerField label="Date of Birth" value={form.dateOfBirth} onChange={(v) => setForm({ ...form, dateOfBirth: v })} />
                </div>
              </div>
            </section>

            {/* Employment Details */}
            <section>
              <h3 className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest mb-6 border-b border-gray-100 dark:border-gray-800 pb-3">
                Employment & Role
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <DatePickerField label="Joining Date" value={form.dateOfJoining} onChange={(v) => setForm({ ...form, dateOfJoining: v })} />
                </div>
                <div>
                  <label className={labelCls}>Job Designation</label>
                  <input name="designation" value={form.designation} onChange={handleChange} className="input-base font-bold" required />
                </div>
                <div>
                  <SelectField
                    label="Assigned Department"
                    name="departmentId"
                    value={form.departmentId}
                    onChange={(v) => setForm(prev => ({ ...prev!, departmentId: v }))}
                    required
                    options={depts.map(o => ({ label: o.name, value: String(o.id) }))}
                  />
                </div>
                <div>
                  <SelectField
                    label="Work Shift Schedule"
                    name="shiftId"
                    value={form.shiftId}
                    onChange={(v) => setForm(prev => ({ ...prev!, shiftId: v }))}
                    required
                    options={shifts.map(o => ({ label: o.shiftName, value: String(o.id) }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <SelectField
                    label="Operational Location"
                    name="locationId"
                    value={form.locationId}
                    onChange={(v) => setForm(prev => ({ ...prev!, locationId: v }))}
                    required
                    options={locs.map(o => ({ label: o.locationName, value: String(o.id) }))}
                  />
                </div>
              </div>
            </section>

            {/* Payroll & Access */}
            <section>
              <h3 className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest mb-6 border-b border-gray-100 dark:border-gray-800 pb-3">
                Payroll & Governance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                <div>
                  <SelectField
                    label="System Permissions"
                    name="role"
                    value={form.role}
                    onChange={(v) => setForm(prev => ({ ...prev!, role: v as EmployeeFormState['role'] }))}
                    required
                    options={ROLE_OPTIONS.map(o => ({ label: o.label, value: o.value }))}
                  />
                </div>
                <div>
                  <SelectField
                    label="Employment Status"
                    value={status}
                    onChange={(v) => setStatus(v as EmployeeStatus)}
                    required
                    options={[
                      { label: "Active", value: "ACTIVE" },
                      { label: "On Leave", value: "ON_LEAVE" },
                      { label: "Resigned", value: "RESIGNED" },
                      { label: "Terminated", value: "TERMINATED" },
                    ]}
                  />
                </div>
                <div>
                  <SelectField
                    label="Payroll Modality"
                    name="paymentType"
                    value={form.paymentType}
                    onChange={(v) => setForm(prev => ({ ...prev!, paymentType: v as EmployeeFormState['paymentType'] }))}
                    required
                    options={PAYMENT_TYPE_OPTIONS.map(o => ({ label: o.label, value: o.value }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Basic Monthly Pay (₹)</label>
                  <input type="number" step="0.01" name="baseSalary" value={form.baseSalary} onChange={handleChange} className="input-base font-mono font-black" />
                </div>
                <div>
                  <label className={labelCls}>HRA Percentage (%)</label>
                  <input type="number" step="0.01" name="hraPercentage" value={form.hraPercentage} onChange={handleChange} className="input-base font-mono font-bold" />
                </div>
                <div>
                  <label className={labelCls}>PF Deduction (%)</label>
                  <input type="number" step="0.01" name="pfPercentage" value={form.pfPercentage} onChange={handleChange} className="input-base font-mono font-bold" />
                </div>
              </div>
            </section>

            {/* Form Actions */}
            <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-gray-100 bg-white/95 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-8 sm:backdrop-blur-0">
              <button
                type="button"
                onClick={onCancel}
                className="px-8 py-3 text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-10 py-3 text-[11px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {updateMutation.isPending ? "Serializing..." : "Update Record"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "leaves" && (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Balance Overview</h3>
            <div className="flex gap-2">
              <button
                onClick={copyLeaveStatement}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-600 transition-all dark:bg-gray-800 dark:text-gray-300 sm:flex-none"
              >
                <Copy size={14} />
                Copy Statement
              </button>
              <button
                onClick={() => setShowAdjustModal(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-sm transition-all hover:bg-indigo-600 hover:text-white dark:bg-indigo-950/30 dark:text-indigo-400 sm:flex-none"
              >
                <ShieldCheck size={14} />
                Manage
              </button>
            </div>
          </div>

          {/* Balances Display Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
            {balances.map(b => {
              const unit = b.unit === "HOURS" ? "h" : "d";
              return (
                <div key={b.leaveTypeCode} className="card p-4 bg-gradient-to-br from-white to-gray-50/50 transition-transform hover:scale-[1.02] dark:from-gray-900 dark:to-gray-800/50 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{b.leaveTypeCode}</span>
                    <Palmtree size={14} className="text-indigo-500/50" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{b.balance}{unit}</span>
                    <span className="text-xs text-gray-400 font-bold tracking-tight">/ {b.allocated}{unit}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                          style={{ width: `${b.allocated > 0 ? (Math.min(b.used, b.allocated) / b.allocated) * 100 : 0}%` }} 
                        />
                    </div>
                    <span className="text-[9px] font-black text-gray-400 uppercase">{Math.round((b.used/b.allocated || 0) * 100)}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transaction Ledger Table */}
          <div className="card overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText size={18} className="text-indigo-500" /> 
                  Leave Transaction Ledger
                </h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Audit trail of all credits and deductions</p>
              </div>
              {loadingLeaves && <Clock size={18} className="text-indigo-400 animate-spin" />}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 font-mono text-[9px] uppercase tracking-[0.15em] border-b border-gray-100 dark:border-gray-800">
                    <th className="px-8 py-5">Transaction Details</th>
                    <th className="px-6 py-5">Ledger Reason</th>
                    <th className="px-6 py-5 text-center">Amount</th>
                    <th className="px-6 py-5 text-center">Net Balance</th>
                    <th className="px-8 py-5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {audits.map(a => {
                    const unit = a.leaveTypeCode === "CMP" ? "h" : "d";
                    return (
                      <tr key={a.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                              a.amount > 0 ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600" : "bg-rose-100 dark:bg-rose-950/40 text-rose-600"
                            }`}>
                              {a.amount > 0 ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
                            </div>
                            <div>
                              <p className="font-black tracking-tight text-gray-900 dark:text-white uppercase text-[10px]">{a.transactionType}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span className="text-[9px] font-black uppercase text-indigo-500 tracking-tighter">{a.leaveTypeCode}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-gray-600 dark:text-gray-400 font-medium italic max-w-[240px] truncate leading-relaxed">
                            {a.reason || "System adjusted"}
                          </p>
                        </td>
                        <td className={`px-6 py-5 text-center font-black tabular-nums text-sm ${a.amount > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                          {a.amount > 0 ? "+" : ""}{a.amount.toFixed(1)}{unit}
                        </td>
                        <td className="px-6 py-5 text-center font-bold text-gray-400 tabular-nums">
                          {a.balanceAfter.toFixed(1)}{unit}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="font-mono text-gray-900 dark:text-white text-[10px]">{new Date(a.createdAt).toLocaleDateString()}</span>
                            <span className="text-[9px] text-gray-400 font-bold mt-0.5 uppercase tracking-tighter">{new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loadingLeaves && audits.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <AlertCircle size={32} />
                          <p className="text-xs font-black uppercase tracking-widest text-gray-500">No Ledger History</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 p-4 md:hidden">
              {audits.map((a) => {
                const unit = a.leaveTypeCode === "CMP" ? "h" : "d";
                return (
                  <div key={a.id} className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase text-gray-900 dark:text-white">{a.transactionType}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-indigo-500">{a.leaveTypeCode}</p>
                      </div>
                      <p className={`text-sm font-black tabular-nums ${a.amount > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                        {a.amount > 0 ? "+" : ""}{a.amount.toFixed(1)}{unit}
                      </p>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{a.reason || "System adjusted"}</p>
                    <div className="mt-3 flex justify-between text-[10px] font-bold text-gray-400">
                      <span>Balance {a.balanceAfter.toFixed(1)}{unit}</span>
                      <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 bg-gray-50/30 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-800 text-center">
              {hasMoreAudits ? (
                <button
                  onClick={() => fetchMoreAudits()}
                  disabled={fetchingMoreAudits}
                  className="mb-4 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {fetchingMoreAudits ? "Loading..." : "Load More Audits"}
                </button>
              ) : null}
              <p className="text-[9px] font-bold text-gray-400 flex items-center justify-center gap-2 uppercase tracking-widest">
                <ShieldCheck size={12} className="text-emerald-500" /> Financial Proof of Stake Verified
              </p>
            </div>
          </div>

          {/* Leave Requests History Table */}
          <div className="card overflow-hidden shadow-xl">
             <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                  <Palmtree size={18} className="text-indigo-500" />
                  Request History
                </h3>
             </div>
             <div className="hidden overflow-x-auto md:block">
               <table className="w-full text-left text-xs">
                 <thead>
                   <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 font-mono text-[9px] uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                     <th className="px-8 py-4">Dates</th>
                     <th className="px-6 py-4">Type</th>
                     <th className="px-6 py-4 text-center">Duration</th>
                     <th className="px-6 py-4 text-center">Status</th>
                     <th className="px-8 py-4">Applied On</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                   {leaveRequests.map(r => {
                      const unit = r.leaveTypeCode === "CMP" ? "h" : "d";
                      return (
                        <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                          <td className="px-8 py-4 font-mono text-gray-600 dark:text-gray-400">
                            {r.startDate} {r.startDate !== r.endDate ? `→ ${r.endDate}` : ""}
                          </td>
                          <td className="px-6 py-4 font-black uppercase text-indigo-500">{r.leaveTypeCode}</td>
                          <td className="px-6 py-4 font-bold text-center">{r.appliedDays}{unit}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                                r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                r.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                'bg-gray-50 text-gray-500 border-gray-200'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-gray-400 font-mono text-[10px]">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                   })}
                   {leaveRequests.length === 0 && !loadingLeaves && (
                     <tr>
                       <td colSpan={5} className="py-12 text-center text-gray-400 italic">No leaves applied yet</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
             <div className="space-y-3 p-4 md:hidden">
               {leaveRequests.map((r) => (
                 <div key={r.id} className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                   <div className="flex items-start justify-between gap-3">
                     <div>
                       <p className="text-sm font-black text-gray-900 dark:text-white">{r.leaveTypeName}</p>
                       <p className="mt-1 text-xs font-semibold text-gray-500">{r.startDate}{r.startDate !== r.endDate ? ` to ${r.endDate}` : ""}</p>
                     </div>
                     <span className="rounded-lg border border-gray-200 px-2 py-1 text-[10px] font-black uppercase text-gray-500 dark:border-gray-700">{r.status}</span>
                   </div>
                   <p className="mt-3 text-xs font-bold text-indigo-500">{r.appliedDays} day(s)</p>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}
      {showAdjustModal && (
        <BalanceAdjustmentModal 
          employeeId={employeeId} 
          balances={balances}
          onClose={() => setShowAdjustModal(false)} 
          onSuccess={() => {
            setShowAdjustModal(false);
          }}
        />
      )}
    </div>
  );
}
