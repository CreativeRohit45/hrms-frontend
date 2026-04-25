import React, { useState, useEffect, useCallback } from "react";
import { updateEmployee, getEmployeeById } from "../../api/employees";
import {
  PAYMENT_TYPE_OPTIONS,
  ROLE_OPTIONS,
  type EmployeeFormState,
  type EmployeeStatus,
} from "../../types/employee";
import { DatePickerField } from "../../components/ui/DatePickerField";
import { SelectField } from "../../components/ui/SelectField";
import { getShifts, getDepartments, getLocations, type Shift, type Department, type CompanyLocation } from "../../api/settings";
import { getEmployeeBalances, getEmployeeAuditTrail } from "../../api/leaves";
import { 
  Palmtree, 
  FileText, 
  Clock, 
  ArrowDownCircle, 
  ArrowUpCircle,
  AlertCircle,
  UserCircle,
  ShieldCheck
} from "lucide-react";
import type { LeaveBalanceResponse, LeaveBalanceAuditResponse, LeaveResponse } from "../../types/leave";
import { getEmployeeRequests } from "../../api/leaves";
import { useGrantLeave, useOverrideBalance, useRunAccrual } from "../../hooks/queries/useLeaves";
import { AppModal } from "../../components/ui/AppModal";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [depts, setDepts] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [locs, setLocs] = useState<CompanyLocation[]>([]);

  // Tabs & Leaves State
  const [activeTab, setActiveTab] = useState<"info" | "leaves">("info");
  const [balances, setBalances] = useState<LeaveBalanceResponse[]>([]);
  const [audits, setAudits] = useState<LeaveBalanceAuditResponse[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveResponse[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  const loadOptions = useCallback(async () => {
    try {
      const [d, s, l] = await Promise.all([
        getDepartments(),
        getShifts(),
        getLocations()
      ]);
      setDepts(d);
      setShifts(s);
      setLocs(l);
    } catch (err) {
      console.error("Failed to load options", err);
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    async function loadEmployee() {
      try {
        const emp = await getEmployeeById(employeeId);
        setForm({
          fullName: emp.fullName,
          phone: emp.phone || "",
          email: emp.email || "",
          dateOfBirth: emp.dateOfBirth || "",
          dateOfJoining: emp.dateOfJoining,
          departmentId: String(emp.departmentId),
          designation: emp.designation,
          shiftId: String(emp.shiftId),
          locationId: String(emp.locationId),
          paymentType: emp.paymentType,
          hourlyRate: String(emp.hourlyRate),
          overtimeRateMultiplier: String(emp.overtimeRateMultiplier),
          role: emp.role,
          baseSalary: emp.baseSalary !== null ? String(emp.baseSalary) : "",
          hraPercentage: emp.hraPercentage !== null ? String(emp.hraPercentage) : "40",
          pfPercentage: emp.pfPercentage !== null ? String(emp.pfPercentage) : "12",
          initialBalances: {},
        });
        setStatus(emp.status);
      } catch (err) {
        setApiError("Failed to load employee details.");
      } finally {
        setLoading(false);
      }
    }
    loadEmployee();
  }, [employeeId]);

  // Load Leaves for the employee
  useEffect(() => {
    if (activeTab === "leaves" && balances.length === 0) {
      setLoadingLeaves(true);
      Promise.all([
        getEmployeeBalances(employeeId),
        getEmployeeAuditTrail(employeeId),
        getEmployeeRequests(employeeId)
      ]).then(([b, a, r]) => {
        setBalances(b);
        setAudits(a);
        setLeaveRequests(r);
      }).catch(err => console.error("Failed to load leaves", err))
        .finally(() => setLoadingLeaves(false));
    }
  }, [activeTab, employeeId, balances.length]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    if (!form) return;
    setForm((prev) => ({ ...prev!, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !status) return;
    setIsSubmitting(true);
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

      const updated = await updateEmployee(employeeId, payload);
      onSuccess(updated.employeeCode);
    } catch (err: any) {
      setApiError(err.response?.data?.message || "Failed to update employee.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const labelCls = "block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5";

  if (loading) return <div className="p-12 text-center text-gray-400 font-mono animate-pulse">Synchronizing Data...</div>;
  if (!form) return <div className="p-12 text-center text-red-500 font-bold">{apiError}</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
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
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/40 p-1.5 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab("info")}
          className={`group flex items-center gap-2 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
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
          className={`group flex items-center gap-2 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
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
        <div className="card p-8 animate-in slide-in-from-left-4 duration-500">
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
            <div className="flex justify-end gap-3 pt-8 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={onCancel}
                className="px-8 py-3 text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-10 py-3 text-[11px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? "Serializing..." : "Update Record"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "leaves" && (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Balance Overview</h3>
            <button 
              onClick={() => setShowAdjustModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
            >
              <ShieldCheck size={14} />
              Manage Balances
            </button>
          </div>

          {/* Balances Display Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {balances.map(b => (
              <div key={b.leaveTypeCode} className="card p-6 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-gray-100 dark:border-gray-800 hover:scale-[1.02] transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{b.leaveTypeCode}</span>
                  <Palmtree size={14} className="text-indigo-500/50" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{b.balance}</span>
                  <span className="text-xs text-gray-400 font-bold tracking-tight">/ {b.allocated}d</span>
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
            ))}
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
            <div className="overflow-x-auto">
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
                  {audits.map(a => (
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
                        {a.amount > 0 ? "+" : ""}{a.amount.toFixed(1)}
                      </td>
                      <td className="px-6 py-5 text-center font-bold text-gray-400 tabular-nums">
                        {a.balanceAfter.toFixed(1)}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="font-mono text-gray-900 dark:text-white text-[10px]">{new Date(a.createdAt).toLocaleDateString()}</span>
                          <span className="text-[9px] text-gray-400 font-bold mt-0.5 uppercase tracking-tighter">{new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
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
            <div className="p-4 bg-gray-50/30 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-800 text-center">
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
             <div className="overflow-x-auto">
               <table className="w-full text-left text-xs">
                 <thead>
                   <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 font-mono text-[9px] uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                     <th className="px-8 py-4">Dates</th>
                     <th className="px-6 py-4">Type</th>
                     <th className="px-6 py-4">Days</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-8 py-4">Applied On</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                   {leaveRequests.map(r => (
                     <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                       <td className="px-8 py-4 font-mono text-gray-600 dark:text-gray-400">
                         {r.startDate} {r.startDate !== r.endDate ? `→ ${r.endDate}` : ""}
                       </td>
                       <td className="px-6 py-4 font-black uppercase text-indigo-500">{r.leaveTypeCode}</td>
                       <td className="px-6 py-4 font-bold">{r.appliedDays}</td>
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
                   ))}
                   {leaveRequests.length === 0 && !loadingLeaves && (
                     <tr>
                       <td colSpan={5} className="py-12 text-center text-gray-400 italic">No leaves applied yet</td>
                     </tr>
                   )}
                 </tbody>
               </table>
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
            setBalances([]); // Trigger reload
            setShowAdjustModal(false);
          }}
        />
      )}
    </div>
  );
}

function BalanceAdjustmentModal({ 
  employeeId, 
  balances,
  onClose, 
  onSuccess 
}: { 
  employeeId: number; 
  balances: LeaveBalanceResponse[];
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<"GRANT" | "OVERRIDE">("GRANT");
  const [leaveTypeId, setLeaveTypeId] = useState(balances[0]?.leaveTypeId || 0);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  
  const grantMutation = useGrantLeave();
  const overrideMutation = useOverrideBalance();
  const accrualMutation = useRunAccrual();

  const handleApply = async () => {
    if (!leaveTypeId || !amount || !reason) return;
    try {
      if (mode === "GRANT") {
        await grantMutation.mutateAsync({ employeeId, leaveTypeId, amount: Number(amount), reason });
      } else {
        await overrideMutation.mutateAsync({ employeeId, leaveTypeId, amount: Number(amount), reason });
      }
      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccrual = async () => {
    if (!window.confirm("Run global accrual engine? This affects all employees.")) return;
    try {
      await accrualMutation.mutateAsync();
      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppModal isOpen={true} onClose={onClose} title="Balance Management" size="md">
      <div className="space-y-6 py-4">
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button 
            onClick={() => setMode("GRANT")}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === "GRANT" ? "bg-white dark:bg-gray-900 text-indigo-600 shadow-sm" : "text-gray-400"}`}
          >
            Credit/Debit
          </button>
          <button 
            onClick={() => setMode("OVERRIDE")}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === "OVERRIDE" ? "bg-white dark:bg-gray-900 text-indigo-600 shadow-sm" : "text-gray-400"}`}
          >
            Hard Override
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <SelectField
              label="Leave Category"
              value={String(leaveTypeId)}
              onChange={(v) => setLeaveTypeId(Number(v))}
              options={balances.map(b => ({ label: b.leaveTypeCode, value: String(b.leaveTypeId) }))}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
              {mode === "GRANT" ? "Adjustment Amount (Days)" : "New Balance Value (Days)"}
            </label>
            <input 
              type="number" 
              step="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={mode === "GRANT" ? "e.g. 1.5 or -1.0" : "e.g. 15.0"}
              className="w-full h-12 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 text-sm font-mono font-black"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Justification / Audit Note</label>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 text-sm font-medium"
              placeholder="Why is this change being made?"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button 
            onClick={handleApply}
            disabled={grantMutation.isPending || overrideMutation.isPending}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            {grantMutation.isPending || overrideMutation.isPending ? "Updating Ledger..." : "Commit Transaction"}
          </button>
          
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-gray-800"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black text-gray-300 dark:text-gray-700"><span className="bg-white dark:bg-gray-900 px-2 tracking-[0.3em]">Danger Zone</span></div>
          </div>

          <button 
            onClick={handleAccrual}
            disabled={accrualMutation.isPending}
            className="w-full py-3 border border-amber-200 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all"
          >
            {accrualMutation.isPending ? "Running Engine..." : "Trigger Global Accrual Run"}
          </button>
        </div>
      </div>
    </AppModal>
  );
}
