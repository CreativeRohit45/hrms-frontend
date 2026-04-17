import { useEffect, useState, useCallback, useMemo } from "react";
import { getEmployees, deleteEmployee } from "../../api/employees";
import type { EmployeeResponse } from "../../types/employee";
import { PencilLine, Trash2, Search, Clock, Building2 } from "lucide-react";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

export default function EmployeeList({ onAddEmployee, onEditEmployee, refreshKey }: { 
  onAddEmployee: () => void, 
  onEditEmployee?: (id: number) => void, 
  refreshKey: number 
}) {
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getEmployees();
      setEmployees(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load employees.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteEmployee(confirmDelete);
      setConfirmDelete(null);
      fetchEmployees();
    } catch {
      setError("Failed to delete employee.");
      setConfirmDelete(null);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees, refreshKey]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.departmentName && emp.departmentName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [employees, searchQuery]);

  const formatShiftTime = (time: string | null | undefined) => {
    if (!time || typeof time !== 'string' || !time.includes(':')) return "--";
    try {
      const [h, m] = time.split(":");
      const hour = parseInt(h);
      if (isNaN(hour)) return "--";
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${m} ${ampm}`;
    } catch {
      return "--";
    }
  };

  if (isLoading) return (
    <div className="p-20 text-center">
      <div className="inline-block animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2"></div>
      <p className="text-gray-500 text-sm font-medium">Loading directory...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header section with Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-gray-900 dark:text-white text-xl font-bold">Employee Directory</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Manage all staff members, departments and schedules</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Search directory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm w-full md:w-64 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all shadow-sm"
            />
          </div>

          <button 
            onClick={onAddEmployee} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg shadow-sm transition-all active:scale-95 whitespace-nowrap"
          >
            Add Employee
          </button>
        </div>
      </div>

      {error && (
        <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
          <span className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</span>
          <button onClick={() => fetchEmployees()} className="text-indigo-600 text-sm font-bold hover:underline">Retry</button>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        {/* DESKTOP TABLE */}
        <div className="max-md:hidden overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 font-mono text-[10px] tracking-wider">
                <th className="px-6 py-4 font-bold w-12 text-center">#</th>
                <th className="px-6 py-4 font-bold">Employee</th>
                <th className="px-6 py-4 font-bold">Department</th>
                <th className="px-6 py-4 font-bold text-center">Shift Schedule</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No record matches your search.</td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => (
                  <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-[11px] text-gray-400 text-center">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-white tracking-tight">{emp.fullName}</span>
                        <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">{emp.employeeCode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Building2 size={14} className="text-gray-400" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs tracking-tight">{emp.departmentName || "--"}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{emp.designation}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-[11px] text-gray-600 dark:text-gray-400 font-bold font-mono">
                          <Clock size={12} className="text-indigo-500" />
                          {formatShiftTime(emp.shiftStartTime)} - {formatShiftTime(emp.shiftEndTime)}
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium mt-1">{emp.shiftName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {onEditEmployee && (
                          <button 
                            onClick={() => onEditEmployee(emp.id)} 
                            className="p-1.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-gray-400 hover:text-indigo-600 transition-all shadow-sm active:scale-90"
                            title="Edit Profile"
                          >
                            <PencilLine size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => emp.id && setConfirmDelete(emp.id)} 
                          className="p-1.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-all shadow-sm active:scale-90"
                          title="Delete Employee"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
          {filteredEmployees.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 italic">No record matches your search.</div>
          ) : (
            filteredEmployees.map((emp) => (
              <div key={emp.id} className="p-5 space-y-4">
                 <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-400">
                          {emp.fullName.charAt(0)}
                       </div>
                       <div>
                          <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{emp.fullName}</h4>
                          <p className="text-[10px] font-mono text-indigo-500 font-black tracking-tight">{emp.employeeCode}</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                        {onEditEmployee && (
                          <button onClick={() => onEditEmployee(emp.id)} className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400">
                             <PencilLine size={16} />
                          </button>
                        )}
                        <button onClick={() => emp.id && setConfirmDelete(emp.id)} className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500">
                           <Trash2 size={16} />
                        </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Department</p>
                       <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{emp.departmentName || '--'}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shift</p>
                       <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          {formatShiftTime(emp.shiftStartTime)} - {formatShiftTime(emp.shiftEndTime)}
                       </p>
                    </div>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message="Are you sure you want to delete this employee record? This action is permanent and will remove all their data from the directory."
      />
    </div>
  );
}