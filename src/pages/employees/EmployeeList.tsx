import { useState, useMemo, useRef, useEffect } from "react";
import type { EmployeeResponse } from "../../types/employee";
import {
  PencilLine, Trash2, Search, Clock,
  Building2, Users, MoreVertical, UserPlus,
  X, AlertTriangle
} from "lucide-react";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { SelectField } from "../../components/ui/SelectField";
import { ActionSheet } from "../../components/ui/ActionSheet";
import { useAllEmployees, useDeleteEmployee, useMyProfile } from "../../hooks/queries/useEmployees";
import { useDepartments } from "../../hooks/queries/useSettings";

// ── Avatar color palette (deterministic by name) ──────────────────
const AVATAR_PALETTES = [
  { bg: "bg-violet-100 dark:bg-violet-950/50", text: "text-violet-700 dark:text-violet-300", ring: "ring-violet-200/60 dark:ring-violet-800/40" },
  { bg: "bg-sky-100 dark:bg-sky-950/50", text: "text-sky-700 dark:text-sky-300", ring: "ring-sky-200/60 dark:ring-sky-800/40" },
  { bg: "bg-emerald-100 dark:bg-emerald-950/50", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200/60 dark:ring-emerald-800/40" },
  { bg: "bg-amber-100 dark:bg-amber-950/50", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-200/60 dark:ring-amber-800/40" },
  { bg: "bg-rose-100 dark:bg-rose-950/50", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-200/60 dark:ring-rose-800/40" },
  { bg: "bg-teal-100 dark:bg-teal-950/50", text: "text-teal-700 dark:text-teal-300", ring: "ring-teal-200/60 dark:ring-teal-800/40" },
  { bg: "bg-indigo-100 dark:bg-indigo-950/50", text: "text-indigo-700 dark:text-indigo-300", ring: "ring-indigo-200/60 dark:ring-indigo-800/40" },
  { bg: "bg-orange-100 dark:bg-orange-950/50", text: "text-orange-700 dark:text-orange-300", ring: "ring-orange-200/60 dark:ring-orange-800/40" },
];

function getPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

// ── Shift formatter ───────────────────────────────────────────────
function formatShiftTime(time: string | null | undefined) {
  if (!time || typeof time !== "string" || !time.includes(":")) return "--";
  try {
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    if (isNaN(hour)) return "--";
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  } catch {
    return "--";
  }
}

// ── Department pill ───────────────────────────────────────────────
function DeptPill({ name }: { name: string | undefined }) {
  if (!name) return <span className="text-xs text-gray-400">—</span>;
  return (
    <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200/60 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-700/40">
      <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
      <span className="truncate max-w-[120px]">{name}</span>
    </span>
  );
}

// ── 3-dot action menu ─────────────────────────────────────────────
function ActionMenu({
  onEdit,
  onDelete,
  hasEdit,
}: {
  onEdit: () => void;
  onDelete: () => void;
  hasEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <ActionSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Employee Actions"
        items={[
          ...(hasEdit ? [{
            label: "Edit Employee",
            description: "Update profile, payroll, role, and leave details",
            icon: <PencilLine className="h-5 w-5" />,
            onClick: onEdit,
          }] : []),
          ...(hasEdit ? [{
            label: "Delete Employee",
            description: "Remove this employee record permanently",
            icon: <Trash2 className="h-5 w-5" />,
            tone: "danger" as const,
            onClick: onDelete,
          }] : []),
        ]}
      />
      <button
        onClick={() => {
          if (window.matchMedia("(max-width: 767px)").matches) setSheetOpen(true);
          else setOpen((v) => !v);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 transition-all hover:border-gray-200 hover:bg-gray-50 hover:text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        title="More actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-30 w-44 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/60 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/40">
          {hasEdit && (
            <button
              onClick={() => { onEdit(); setOpen(false); }}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300"
            >
              <PencilLine className="h-4 w-4" />
              Edit Profile
            </button>
          )}
          {hasEdit && (
            <>
              <div className="mx-3 border-t border-gray-100 dark:border-gray-800" />
              <button
                onClick={() => { onDelete(); setOpen(false); }}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete Employee
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="h-16 w-16 rounded-2xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-7 w-7 rounded-xl bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="space-y-2 pt-1">
          <div className="h-4 w-32 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-24 rounded-full bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-6 w-28 rounded-xl bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="border-t border-gray-100 px-6 py-4 dark:border-gray-800">
        <div className="h-3 w-36 rounded-full bg-gray-100 dark:bg-gray-800" />
      </div>
    </div>
  );
}

// ── Employee Card ─────────────────────────────────────────────────
function EmployeeCard({
  emp,
  index,
  onEdit,
  onDelete,
  hasEdit,
}: {
  emp: EmployeeResponse;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  hasEdit: boolean;
}) {
  const palette = getPalette(emp.fullName);
  const initials = getInitials(emp.fullName);
  const shiftStr = `${formatShiftTime(emp.shiftStartTime)} – ${formatShiftTime(emp.shiftEndTime)}`;

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:shadow-gray-200/60 hover:border-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 dark:hover:shadow-black/30"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Card body */}
      <div className="flex flex-1 flex-col gap-4 p-6">
        {/* Top: Avatar + menu */}
        <div className="flex items-start justify-between">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black ring-2 ${palette.bg} ${palette.text} ${palette.ring} transition-transform duration-200 group-hover:scale-105`}
          >
            {initials}
          </div>
          <ActionMenu onEdit={onEdit} onDelete={onDelete} hasEdit={hasEdit} />
        </div>

        {/* Name + Designation */}
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-base font-black tracking-tight text-gray-900 dark:text-white">
            {emp.fullName}
          </p>
          <p className="truncate text-xs font-semibold text-gray-400 dark:text-gray-500">
            {emp.designation || "—"}
          </p>
          <p className="mt-1 font-mono text-[10px] font-black tracking-wider text-indigo-400/80">
            {emp.employeeCode}
          </p>
        </div>

        {/* Department pill */}
        <DeptPill name={emp.departmentName} />
      </div>

      {/* Card footer: shift info */}
      <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-3.5 dark:border-gray-800 dark:bg-gray-800/30">
        <Clock className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
        <span className="min-w-0 truncate font-mono text-[11px] font-bold text-gray-500 dark:text-gray-400">
          {shiftStr}
        </span>
        {emp.shiftName && (
          <>
            <span className="text-gray-200 dark:text-gray-700">·</span>
            <span className="min-w-0 truncate text-[11px] font-medium text-gray-400 dark:text-gray-500">
              {emp.shiftName}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────
function EmptyState({ hasSearch, onAdd }: { hasSearch: boolean; onAdd: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 py-24 text-center dark:border-gray-800 dark:bg-gray-900/30">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <Users className="h-8 w-8 text-slate-400 dark:text-slate-500" />
      </div>
      <p className="mt-5 text-lg font-black tracking-tight text-gray-800 dark:text-white">
        {hasSearch ? "No matching employees" : "No employees yet"}
      </p>
      <p className="mt-1.5 max-w-xs text-sm text-gray-500 dark:text-gray-400">
        {hasSearch
          ? "Try adjusting your search or clearing the filter."
          : "Add your first team member to get the directory started."}
      </p>
      {!hasSearch && (
        <button
          onClick={onAdd}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white shadow-md shadow-indigo-200/50 transition-all hover:bg-indigo-700 active:scale-95 dark:shadow-indigo-900/30"
        >
          <UserPlus className="h-4 w-4" />
          Add First Employee
        </button>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function EmployeeList({
  onAddEmployee,
  onEditEmployee,
}: {
  onAddEmployee: () => void;
  onEditEmployee?: (id: number) => void;
}) {
  const { data: me } = useMyProfile();
  const isManager = me?.role === "DEPARTMENT_MANAGER";
  const canManage = me?.role === "HR_ADMIN" || me?.role === "SUPER_ADMIN";

  const [currentPage, setCurrentPage] = useState(0);
  const [selectedDeptId, setSelectedDeptId] = useState<number | undefined>(undefined);
  const pageSize = 50;

  const { data: departments } = useDepartments();
  const { data: pageData, isLoading, isError, error: queryError, refetch } = useAllEmployees(currentPage, pageSize, selectedDeptId);
  const employees = pageData?.content || [];
  const totalPages = pageData?.totalPages || 0;
  
  const deleteMutation = useDeleteEmployee();

  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // When searching, we keep current page (server filters if backend supported it, 
  // but here we filter locally on the paged content for now or reset page if we hit the backend).
  // Directive: reset to page 0 if search query changes to avoid being on page 10 with 0 results.
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMutation.mutateAsync(confirmDelete);
      setConfirmDelete(null);
    } catch {
      setConfirmDelete(null);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (emp) =>
        emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.departmentName && emp.departmentName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [employees, searchQuery]);

  const errorMessage = isError ? ((queryError as any)?.message || "Failed to load employees.") : null;

  return (
    <div className="mx-auto w-full max-w-7xl overflow-hidden space-y-0 px-4 sm:px-6 md:px-8">

      {/* ═══════════════════════════════════════════════════════════
          MISSION 1 — HEADER + STICKY SEARCH
      ═══════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-20 -mx-4 bg-white/90 px-4 pb-4 pt-4 backdrop-blur-md dark:bg-gray-950/90 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
        {/* Title row */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                  Team Directory
                </h1>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {isLoading ? "Loading…" : `${employees.length} ${employees.length === 1 ? "member" : "members"}`}
                </p>
              </div>
            </div>
          </div>

          {canManage && (
            <button
              onClick={onAddEmployee}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white shadow-md shadow-indigo-200/50 transition-all hover:bg-indigo-700 active:scale-95 dark:shadow-indigo-900/30"
            >
              <UserPlus className="h-4 w-4 shrink-0" />
              <span>Add Employee</span>
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400 transition-colors" />
            <input
              type="text"
              placeholder="Search by name, code, or department…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3 pl-11 pr-10 text-sm font-medium text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:placeholder-gray-600 dark:focus:bg-gray-800/80"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Department Filter (HR/Super Admin only) */}
          {!isManager && (
            <div className="min-w-[200px]">
              <SelectField
                compact
                value={selectedDeptId ? String(selectedDeptId) : ""}
                onChange={(v) => {
                  setSelectedDeptId(v ? parseInt(v) : undefined);
                  setCurrentPage(0);
                }}
                placeholder="All Departments"
                options={departments?.map(d => ({ label: d.name, value: String(d.id) })) || []}
              />
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-800" />
      </div>

      {/* ── spacer so content doesn't sit under sticky header ── */}
      <div className="pt-6" />

      {/* Error banner */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-900 dark:bg-red-950/20">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
            <span className="truncate text-sm font-semibold text-red-600 dark:text-red-400">
              {errorMessage}
            </span>
          </div>
          <button
            onClick={() => refetch()}
            className="ml-4 shrink-0 rounded-xl bg-white px-3 py-1.5 text-xs font-black text-indigo-600 shadow-sm transition hover:bg-indigo-50 dark:bg-gray-900 dark:hover:bg-indigo-950/30"
          >
            Retry
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MISSION 2 — EMPLOYEE CARDS GRID
      ═══════════════════════════════════════════════════════════ */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.length === 0 ? (
            <EmptyState hasSearch={searchQuery.length > 0} onAdd={onAddEmployee} />
          ) : (
            filteredEmployees.map((emp, index) => (
              <EmployeeCard
                key={emp.id}
                emp={emp}
                index={index}
                onEdit={() => onEditEmployee?.(emp.id)}
                onDelete={() => emp.id && setConfirmDelete(emp.id)}
                hasEdit={canManage}
              />
            ))
          )}
        </div>
      )}

      {/* ── Results label ── */}
      {!isLoading && employees.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row">
          <p className="text-xs font-semibold text-gray-400">
            {searchQuery 
              ? `Showing ${filteredEmployees.length} filtered results on this page` 
              : `Page ${currentPage + 1} of ${totalPages} (${pageData?.totalElements || 0} total employees)`}
          </p>

          {/* Pagination Buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="flex h-9 min-w-[36px] items-center justify-center rounded-xl border border-gray-100 bg-white px-3 text-xs font-bold text-gray-700 shadow-sm transition-all hover:border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1.5 px-3">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  // Show pages around current page logic could go here, 
                  // but for now 1..5 is a good start.
                  const pageNum = i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 w-8 rounded-lg text-xs font-black transition-all ${
                        currentPage === pageNum
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none"
                          : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="flex h-9 min-w-[36px] items-center justify-center rounded-xl border border-gray-100 bg-white px-3 text-xs font-bold text-gray-700 shadow-sm transition-all hover:border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Confirm delete modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Employee Record"
        message="Are you absolutely sure you want to delete this employee? This will permanently remove their profile, attendance logs, and payroll history. This action CANNOT be undone."
        confirmText="DELETE"
        requireConfirmText="DELETE"
        isDestructive={true}
      />
    </div>
  );
}
