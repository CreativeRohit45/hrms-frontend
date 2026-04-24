import React, { useState } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import type { ColumnDef } from "../../components/ui/DataTable";
import { useAllEmployees } from "../../hooks/queries/useEmployees";
import { useLeaveTypes, useBulkGrantLeaves } from "../../hooks/queries/useLeaves";
import { useAppToast } from "../../components/ui/ToastProvider";
import type { EmployeeResponse } from "../../types/employee";

export default function AdminBulkOps() {
  const { pushToast } = useAppToast();
  const { data: employeesPage, isLoading: isEmployeesLoading } = useAllEmployees(0, 1000); // Fetch all for simplicity
  const { data: leaveTypes = [] } = useLeaveTypes();
  const { mutateAsync: bulkGrant, isPending } = useBulkGrantLeaves();

  const employees = employeesPage?.content || [];

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [form, setForm] = useState({
    leaveTypeId: "",
    amount: "",
    reason: "",
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(employees.map(e => e.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0) {
      pushToast({ tone: "error", title: "Validation Error", message: "Please select at least one employee." });
      return;
    }
    if (!form.leaveTypeId || !form.amount) {
      pushToast({ tone: "error", title: "Validation Error", message: "Please fill all required fields." });
      return;
    }

    try {
      await bulkGrant({
        employeeIds: Array.from(selectedIds),
        leaveTypeId: parseInt(form.leaveTypeId),
        amount: parseFloat(form.amount),
        reason: form.reason || "Bulk grant by Admin"
      });
      pushToast({ tone: "success", title: "Success", message: `Successfully granted leave to ${selectedIds.size} employees.` });
      setSelectedIds(new Set());
      setForm({ leaveTypeId: "", amount: "", reason: "" });
    } catch {
      pushToast({ tone: "error", title: "Error", message: "Failed to perform bulk grant." });
    }
  };

  const columns: ColumnDef<EmployeeResponse>[] = [
    {
      header: (
        <input 
          type="checkbox" 
          checked={selectedIds.size === employees.length && employees.length > 0}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      ),
      cell: (emp) => (
        <input 
          type="checkbox" 
          checked={selectedIds.has(emp.id)}
          onChange={(e) => handleSelectRow(emp.id, e.target.checked)}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      ),
    },
    { header: "Code", cell: (emp) => <span className="font-mono text-sm">{emp.employeeCode}</span> },
    { header: "Name", cell: (emp) => <span className="font-semibold">{emp.fullName}</span> },
    { header: "Department", cell: (emp) => <span className="text-gray-500">{emp.departmentName}</span> },
    { header: "Role", cell: (emp) => <span className="text-gray-500">{emp.role}</span> },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader 
        title="Bulk Operations" 
        subtitle="Perform actions across multiple employees simultaneously" 
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left Col: Employee Selection Grid */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Select Employees</h3>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full">
              {selectedIds.size} selected
            </span>
          </div>
          
          <div className="flex-1 overflow-auto border border-gray-100 dark:border-gray-800 rounded-xl">
            <DataTable 
              columns={columns} 
              data={employees} 
              isLoading={isEmployeesLoading} 
              pagination={{ pageSize: 15 }}
            />
          </div>
        </div>

        {/* Right Col: Action Form */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Bulk Grant Leaves</h3>
            
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Leave Type</label>
                <select 
                  required
                  value={form.leaveTypeId}
                  onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:bg-gray-900"
                >
                  <option value="" disabled>Select Type</option>
                  {leaveTypes.map(lt => (
                    <option key={lt.id} value={lt.id}>{lt.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Amount (Days)</label>
                <input 
                  type="number" 
                  step="0.5" 
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 5"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:bg-gray-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Reason</label>
                <textarea 
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. Annual company-wide bonus leave"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:bg-gray-900 resize-none h-24"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isPending || selectedIds.size === 0}
              className="mt-6 w-full rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 disabled:opacity-60"
            >
              {isPending ? "Processing..." : `Grant to ${selectedIds.size} Employees`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
