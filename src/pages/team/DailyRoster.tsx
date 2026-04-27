import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Search, Sparkles, Users, Download } from "lucide-react";
import { useDailyRosterLogs } from "../../hooks/queries/useAttendance";
import { useDepartments, useShifts } from "../../hooks/queries/useSettings";
import { formatTime } from "../../types/attendance";
import { SelectField } from "../../components/ui/SelectField";
import { DatePickerField } from "../../components/ui/DatePickerField";
import { FilterSheet, MobileFilterButton } from "../../components/ui/FilterSheet";
import { useAuth } from "../../context/AuthContext";
import { exportToCSV } from "../attendance/components/shared";

function getInitials(name: string) {
  if (!name) return "??";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function toDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function AttendanceBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PRESENT: { label: "Present", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/60" },
    LATE: { label: "Late", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60" },
    ABSENT: { label: "Absent", cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800/60" },
    ON_LEAVE: { label: "On Leave", cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800/60" },
  };
  const cfg = map[status] ?? {
    label: status?.replaceAll("_", " ") ?? "Unknown",
    cls: "bg-gray-100 text-gray-600 ring-1 ring-gray-200/60 dark:bg-gray-800 dark:text-gray-300",
  };
  return <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${cfg.cls}`}>{cfg.label}</span>;
}

function RosterCard({ item }: { item: any }) {
  const initials = getInitials(item.fullName);
  const avatarColor: Record<string, string> = {
    PRESENT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    LATE: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    ABSENT: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    ON_LEAVE: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  };
  const stripColor: Record<string, string> = {
    PRESENT: "bg-emerald-500",
    LATE: "bg-amber-400",
    ABSENT: "bg-rose-500",
    ON_LEAVE: "bg-blue-500",
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-150 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className={`absolute bottom-0 left-0 top-0 w-1 ${stripColor[item.attendanceStatus] ?? "bg-gray-300"}`} />
      <div className="flex flex-col gap-3.5 p-5 pl-6">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${avatarColor[item.attendanceStatus] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-gray-900 dark:text-white">{item.fullName}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/70">{item.employeeCode}</p>
          </div>
          <AttendanceBadge status={item.attendanceStatus} />
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/40">
          <Clock className="h-4 w-4 shrink-0 text-gray-400" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Punch In / Out</p>
            <p className="mt-0.5 text-xs font-bold text-gray-800 dark:text-gray-200">
              {formatTime(item.punchInTime)}
              <span className="mx-2 text-gray-300 dark:text-gray-600">→</span>
              {formatTime(item.punchOutTime)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-2.5 py-1 dark:bg-indigo-950/30">
            <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
              {item.calculatedPayableMinutes ? `${Math.floor(item.calculatedPayableMinutes / 60)}h ${item.calculatedPayableMinutes % 60}m` : '0m'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DailyRoster() {
  const { user } = useAuth();
  const [selectedDateStr, setSelectedDateStr] = useState<string>(toDateString(new Date()));
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShiftId, setSelectedShiftId] = useState<number | "ALL">("ALL");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | "ALL">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 50;

  const { data: shiftsData } = useShifts();
  const shifts = shiftsData || [];
  const canFilterDepartment = user?.role === "HR_ADMIN" || user?.role === "SUPER_ADMIN";
  const { data: departments = [] } = useDepartments(canFilterDepartment);

  const { data: rosterData, isLoading } = useDailyRosterLogs(
    selectedDateStr,
    currentPage,
    pageSize,
    selectedShiftId,
    canFilterDepartment ? selectedDepartmentId : "ALL",
    selectedStatus
  );

  const roster = rosterData?.content || [];
  const totalPages = rosterData?.totalPages || 0;
  const totalElements = rosterData?.totalElements || 0;

  const filteredRoster = useMemo(() => {
    if (!searchTerm) return roster;
    const s = searchTerm.toLowerCase();
    return roster.filter((r) => r.fullName.toLowerCase().includes(s) || r.employeeCode.toLowerCase().includes(s));
  }, [roster, searchTerm]);

  const overviewStats = useMemo(
    () => ({
      present: roster.filter((r) => r.attendanceStatus === "PRESENT").length,
      late: roster.filter((r) => r.attendanceStatus === "LATE").length,
      leave: roster.filter((r) => r.attendanceStatus === "ON_LEAVE").length,
      absent: roster.filter((r) => r.attendanceStatus === "ABSENT").length,
    }),
    [roster]
  );

  const shiftDate = (days: number) => {
    const d = new Date(`${selectedDateStr}T00:00:00`);
    d.setDate(d.getDate() + days);
    setSelectedDateStr(toDateString(d));
    setCurrentPage(0);
  };

  const isToday = selectedDateStr === toDateString(new Date());
  const statusOptions = [
    { label: "All Statuses", value: "ALL" },
    { label: "Present", value: "PRESENT" },
    { label: "Absent", value: "ABSENT" },
    { label: "Half Day", value: "HALF_DAY" },
    { label: "Late", value: "LATE" },
    { label: "On Leave", value: "ON_LEAVE" },
    { label: "Holiday", value: "HOLIDAY" },
    { label: "Weekend Work", value: "WEEKEND_WORK" },
    { label: "Holiday Work", value: "HOLIDAY_WORK" },
  ];

  const sheetFilterControls = (
    <>
      {canFilterDepartment && (
        <SelectField
          label="Department"
          value={selectedDepartmentId === "ALL" ? "" : String(selectedDepartmentId)}
          onChange={(v) => {
            setSelectedDepartmentId(v === "" ? "ALL" : Number(v));
            setCurrentPage(0);
          }}
          placeholder="All Departments"
          options={departments.map((d: any) => ({ label: d.name, value: String(d.id) }))}
        />
      )}
      <SelectField
        label="Shift"
        value={selectedShiftId === "ALL" ? "" : String(selectedShiftId)}
        onChange={(v) => {
          setSelectedShiftId(v === "" ? "ALL" : Number(v));
          setCurrentPage(0);
        }}
        placeholder="All Shifts"
        options={shifts.map((s) => ({ label: s.shiftName, value: String(s.id) }))}
      />
      <SelectField
        label="Status"
        value={selectedStatus === "ALL" ? "" : selectedStatus}
        onChange={(v) => {
          setSelectedStatus(v || "ALL");
          setCurrentPage(0);
        }}
        placeholder="All Statuses"
        options={statusOptions.filter((o) => o.value !== "ALL")}
      />
    </>
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 overflow-x-hidden px-3 pb-20 sm:space-y-6 sm:px-6 md:px-8">
      <FilterSheet
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        footer={
          <button type="button" onClick={() => setFiltersOpen(false)} className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black text-white">
            Apply Filters
          </button>
        }
      >
        {sheetFilterControls}
      </FilterSheet>

      <div className="flex flex-col gap-5 rounded-2xl bg-white p-4 shadow-sm border border-gray-100 dark:border-gray-800 dark:bg-slate-900 sm:rounded-[2.5rem] sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-indigo-500 shadow-lg shadow-indigo-500/20">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Daily Roster</h1>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400">Team Visibility</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => exportToCSV(filteredRoster, `roster_${selectedDateStr}.csv`)}
              className="flex items-center gap-2 h-[44px] px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <div className="flex items-center gap-2 rounded-2xl bg-gray-50 p-1.5 ring-1 ring-gray-100 dark:bg-white/10 dark:ring-white/10">
            <button onClick={() => shiftDate(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 transition-all hover:bg-gray-100 dark:text-white dark:hover:bg-white/10">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 px-1 [&>div>button]:!h-auto [&>div>button]:!border-none [&>div>button]:!bg-transparent [&>div>button]:!px-2 [&>div>button]:!py-1.5 [&>div>button]:!text-sm [&>div>button]:!font-black [&>div>button]:!text-gray-700 dark:[&>div>button]:!text-white [&>div>button]:!shadow-none [&>div>button]:!ring-0 [&_label]:!hidden">
              <DatePickerField align="right" value={selectedDateStr} onChange={(v) => { setSelectedDateStr(v); setCurrentPage(0); }} />
            </div>
            {isToday && <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Today</span>}
            <button onClick={() => shiftDate(1)} disabled={isToday} className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 transition-all hover:bg-gray-100 disabled:opacity-20 dark:text-white dark:hover:bg-white/10">
              <ChevronRight className="h-5 w-5" />
            </button>
            </div>
          </div>
        </div>

        <div className={`grid gap-3 md:items-center ${canFilterDepartment ? "md:grid-cols-[minmax(0,1fr)_190px_190px_190px]" : "md:grid-cols-[minmax(0,1fr)_190px_190px]"}`}>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Quick search name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl bg-gray-50 py-3.5 pl-11 pr-4 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none ring-1 ring-gray-200 focus:ring-indigo-500/50 dark:bg-white/5 dark:text-white dark:placeholder-slate-500 dark:ring-white/10"
            />
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <MobileFilterButton
              onClick={() => setFiltersOpen(true)}
              activeCount={(selectedShiftId !== "ALL" ? 1 : 0) + (selectedStatus !== "ALL" ? 1 : 0) + (selectedDepartmentId !== "ALL" ? 1 : 0)}
            />
          </div>
          {canFilterDepartment && (
            <div className="hidden md:block [&_select]:!rounded-2xl [&_select]:!border-gray-200 [&_select]:!bg-gray-50 [&_select]:!text-gray-900 [&_select]:!shadow-none [&_select]:focus:!border-indigo-400 [&_svg]:!text-gray-400 dark:[&_select]:!border-white/10 dark:[&_select]:!bg-white/10 dark:[&_select]:!text-white dark:[&_svg]:!text-white/50">
              <SelectField
                compact
                value={selectedDepartmentId === "ALL" ? "" : String(selectedDepartmentId)}
                onChange={(v) => {
                  setSelectedDepartmentId(v === "" ? "ALL" : Number(v));
                  setCurrentPage(0);
                }}
                placeholder="All Departments"
                options={departments.map((d: any) => ({ label: d.name, value: String(d.id) }))}
              />
            </div>
          )}
          <div className="hidden md:block [&_select]:!rounded-2xl [&_select]:!border-gray-200 [&_select]:!bg-gray-50 [&_select]:!text-gray-900 [&_select]:!shadow-none [&_select]:focus:!border-indigo-400 [&_svg]:!text-gray-400 dark:[&_select]:!border-white/10 dark:[&_select]:!bg-white/10 dark:[&_select]:!text-white dark:[&_svg]:!text-white/50">
            <SelectField
              compact
              value={selectedShiftId === "ALL" ? "" : String(selectedShiftId)}
              onChange={(v) => {
                setSelectedShiftId(v === "" ? "ALL" : Number(v));
                setCurrentPage(0);
              }}
              placeholder="All Shifts"
              options={shifts.map((s) => ({ label: s.shiftName, value: String(s.id) }))}
            />
          </div>
          <div className="hidden md:block [&_select]:!rounded-2xl [&_select]:!border-gray-200 [&_select]:!bg-gray-50 [&_select]:!text-gray-900 [&_select]:!shadow-none [&_select]:focus:!border-indigo-400 [&_svg]:!text-gray-400 dark:[&_select]:!border-white/10 dark:[&_select]:!bg-white/10 dark:[&_select]:!text-white dark:[&_svg]:!text-white/50">
            <SelectField
              compact
              value={selectedStatus === "ALL" ? "" : selectedStatus}
              onChange={(v) => {
                setSelectedStatus(v || "ALL");
                setCurrentPage(0);
              }}
              placeholder="All Statuses"
              options={statusOptions.filter((o) => o.value !== "ALL")}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Present", value: overviewStats.present },
          { label: "Late", value: overviewStats.late },
          { label: "On Leave", value: overviewStats.leave },
          { label: "Absent", value: overviewStats.absent },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
            <p className="mt-1 text-lg font-black text-gray-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:rounded-[2.5rem]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Synchronizing Roster...</p>
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-300 dark:bg-gray-800 dark:text-gray-600">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-black text-gray-900 dark:text-white">No results found</h3>
            <p className="text-sm text-gray-500">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 dark:border-gray-800">
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Employee</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">In / Out</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Payable Time</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Overtime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {filteredRoster.map((item) => (
                    <tr key={item.id} className="group transition-all hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-[11px] font-black text-indigo-600 dark:bg-indigo-950/40">
                            {getInitials(item.fullName)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 dark:text-white">{item.fullName}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{item.employeeCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><AttendanceBadge status={item.attendanceStatus} /></td>
                      <td className="px-6 py-4 text-sm font-black tabular-nums text-gray-700 dark:text-gray-300">
                        {formatTime(item.punchInTime)} <span className="mx-1 text-gray-300">→</span> {formatTime(item.punchOutTime)}
                      </td>
                      <td className="px-6 py-4 text-sm font-black tabular-nums text-gray-700 dark:text-gray-300">
                        {item.calculatedPayableMinutes ? `${Math.floor(item.calculatedPayableMinutes / 60)}h ${item.calculatedPayableMinutes % 60}m` : '0m'}
                      </td>
                      <td className="px-6 py-4">
                        {item.overtime ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2 py-1 text-[10px] font-black text-purple-600 dark:bg-purple-950/40">
                            <Sparkles className="h-3 w-3" />
                            {item.overtimeMinutes}m
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-700">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-2 md:hidden">
              {filteredRoster.map((item) => (
                <RosterCard key={item.id} item={item} />
              ))}
            </div>

            <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-50 px-6 py-4 dark:border-gray-800 sm:flex-row">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Page {currentPage + 1} of {totalPages} ({totalElements} Records)
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="rounded-xl border border-gray-100 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 disabled:opacity-30 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400"
                >
                  Prev
                </button>
                <button
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="rounded-xl border border-gray-100 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 disabled:opacity-30 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
