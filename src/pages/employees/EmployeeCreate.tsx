// src/pages/employees/EmployeeCreate.tsx
import React, { useState } from "react";
import { createEmployee } from "../../api/employees";
import {
  EMPTY_FORM,
  PAYMENT_TYPE_OPTIONS,
  ROLE_OPTIONS,
  type EmployeeFormState,
} from "../../types/employee";
import { DatePickerField } from "../../components/ui/DatePickerField";
import { getShifts, getDepartments, getLocations, type Shift, type Department, type CompanyLocation } from "../../api/settings";
import { useEffect, useCallback } from "react";

export default function EmployeeCreate({
  onSuccess,
  onCancel,
}: {
  onSuccess: (c: string) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<EmployeeFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [depts, setDepts] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [locs, setLocs] = useState<CompanyLocation[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const [d, s, l] = await Promise.all([
        getDepartments(),
        getShifts(),
        getLocations()
      ]);
      setDepts(d);
      setShifts(s);
      setLocs(l);

      // Auto-set first options if not already set
      setForm(prev => ({
        ...prev,
        departmentId: prev.departmentId || (d[0]?.id?.toString() || ""),
        shiftId: prev.shiftId || (s[0]?.id?.toString() || ""),
        locationId: prev.locationId || (l[0]?.id?.toString() || ""),
      }));
    } catch (err) {
      console.error("Failed to load form options", err);
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => { loadOptions(); }, [loadOptions]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError(null);
    try {
      // Build the exact payload the Spring Boot backend expects
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
        baseSalary: Number(form.baseSalary) || 0,
        hraPercentage: Number(form.hraPercentage) || 40,
        pfPercentage: Number(form.pfPercentage) || 12,
      };
      
      const created = await createEmployee(payload);
      onSuccess(created.employeeCode);
    } catch (err: any) {
      setApiError(
        err.response?.data?.message || 
        "Failed to create employee. Please check all required fields."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const labelCls = "block text-[10px] font-mono font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 dark:text-white text-xl font-bold">Add New Employee</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 font-mono">
            Employee code is auto-generated · Default password: Welcome@123
          </p>
        </div>
      </div>

      <div className="card p-6">
        {apiError && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 mb-6 text-red-600 dark:text-red-400 text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Info Section */}
          <div>
            <h3 className="text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
              Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input name="fullName" value={form.fullName} onChange={handleChange} className="input-base" required placeholder="e.g. John Doe"/>
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className="input-base" placeholder="john@example.com"/>
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="input-base" placeholder="10-digit number"/>
              </div>
              <div>
                <DatePickerField label="Date of Birth" value={form.dateOfBirth} onChange={(v) => setForm({ ...form, dateOfBirth: v })} />
              </div>
            </div>
          </div>

          {/* Work Assignment Section */}
          <div>
            <h3 className="text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
              Work Assignment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <DatePickerField label="Date of Joining" value={form.dateOfJoining} onChange={(v) => setForm({ ...form, dateOfJoining: v })} />
              </div>
              <div>
                <label className={labelCls}>Designation *</label>
                <input name="designation" value={form.designation} onChange={handleChange} className="input-base" required placeholder="e.g. Software Engineer"/>
              </div>
              <div>
                <label className={labelCls}>Department *</label>
                <select name="departmentId" value={form.departmentId} onChange={handleChange} className="input-base" required>
                  <option value="" disabled>{loadingOptions ? "Loading..." : "— Select Department —"}</option>
                  {depts.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Shift *</label>
                <select name="shiftId" value={form.shiftId} onChange={handleChange} className="input-base" required>
                  <option value="" disabled>{loadingOptions ? "Loading..." : "— Select Shift —"}</option>
                  {shifts.map((o) => (
                    <option key={o.id} value={o.id}>{o.shiftName}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Location *</label>
                <select name="locationId" value={form.locationId} onChange={handleChange} className="input-base" required>
                  <option value="" disabled>{loadingOptions ? "Loading..." : "— Select Location —"}</option>
                  {locs.map((o) => (
                    <option key={o.id} value={o.id}>{o.locationName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Compensation & Access Section */}
          <div>
            <h3 className="text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
              Compensation & Access
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className={labelCls}>System Role *</label>
                <select name="role" value={form.role} onChange={handleChange} className="input-base" required>
                  <option value="">— Select Role —</option>
                  {ROLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Payment Type *</label>
                <select name="paymentType" value={form.paymentType} onChange={handleChange} className="input-base" required>
                  <option value="">— Select Type —</option>
                  {PAYMENT_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Hourly Rate (₹) *</label>
                <input type="number" step="0.01" name="hourlyRate" value={form.hourlyRate} onChange={handleChange} className="input-base" required placeholder="0.00"/>
              </div>
              <div>
                <label className={labelCls}>Overtime Multiplier</label>
                <input type="number" step="0.1" name="overtimeRateMultiplier" value={form.overtimeRateMultiplier} onChange={handleChange} className="input-base" placeholder="1.5"/>
              </div>
            </div>
          </div>

          {/* Salary Configuration Section */}
          <div>
            <h3 className="text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
              Salary Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className={labelCls}>Base Salary (₹)</label>
                <input type="number" step="0.01" name="baseSalary" value={form.baseSalary} onChange={handleChange} className="input-base" placeholder="e.g. 25000"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>HRA (%)</label>
                  <input type="number" step="0.1" name="hraPercentage" value={form.hraPercentage} onChange={handleChange} className="input-base" />
                </div>
                <div>
                  <label className={labelCls}>PF (%)</label>
                  <input type="number" step="0.1" name="pfPercentage" value={form.pfPercentage} onChange={handleChange} className="input-base" />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 justify-end pt-6 border-t border-gray-100 dark:border-gray-800">
            <button type="button" onClick={onCancel} className="px-6 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center gap-2">
              {isSubmitting ? "Saving..." : "Create Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}