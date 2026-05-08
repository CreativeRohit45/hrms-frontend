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

function AttendanceBadge({ status, isLate }: { status: string; isLate?: boolean }) {
  const map: Record<string, { label: string; cls: string }> = {
    PRESENT: { label: "Present", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/60" },
    ABSENT: { label: "Absent", cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800/60" },
    ON_LEAVE: { label: "On Leave", cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800/60" },
    HALF_DAY: { label: "Half Day", cls: "bg-orange-50 text-orange-700 ring-1 ring-orange-200/60 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-800/60" },
    WEEKEND_WORK: { label: "Weekend Work", cls: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-800/60" },
    HOLIDAY_WORK: { label: "Holiday Work", cls: "bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200/60 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:ring-fuchsia-800/60" },
  };
  const cfg = map[status] ?? {
    label: status?.replaceAll("_", " ") ?? "Unknown",
    cls: "bg-gray-100 text-gray-600 ring-1 ring-gray-200/60 dark:bg-gray-800 dark:text-gray-300",
  };
  return (
    <div className="flex flex-col items-start gap-1 shrink-0">
      {isLate && (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase sm:normal-case tracking-wide sm:tracking-normal bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60">
          Late
        </span>
      )}
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase sm:normal-case tracking-wide sm:tracking-normal ${cfg.cls}`}>
        {cfg.label}
      </span>
    </div>
  );
}

function RosterCard({ item }: { item: any }) {
  const initials = getInitials(item.fullName);
  const avatarColor: Record<string, string> = {
    PRESENT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    ABSENT: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    ON_LEAVE: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  };
  const stripColor: Record<string, string> = {
    PRESENT: "bg-emerald-500",
    ABSENT: "bg-rose-500",
    ON_LEAVE: "bg-blue-500",
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-150 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className={`absolute bottom-0 left-0 top-0 w-1 ${stripColor[item.attendanceStatus] ?? "bg-gray-300"}`} />
      <div className="flex flex-col gap-3.5 p-4 sm:p-5 sm:pl-6">
        <div className="flex items-start sm:items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${avatarColor[item.attendanceStatus] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-gray-900 dark:text-white">{item.fullName}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/70">{item.employeeCode}</p>
          </div>
          <AttendanceBadge status={item.attendanceStatus} isLate={item.late} />
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
      present: roster.filter((r) => r.attendanceStatus === "PRESENT" || r.attendanceStatus === "HALF_DAY" || r.attendanceStatus === "WEEKEND_WORK" || r.attendanceStatus === "HOLIDAY_WORK").length,
      late: roster.filter((r) => r.late).length,
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
    { label: "Late", value: "LATE" },
    { label: "Absent", value: "ABSENT" },
    { label: "Half Day", value: "HALF_DAY" },
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

      {/* ── HERO BANNER ──────────────────────────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-6 shadow-xl shadow-indigo-200/40 dark:shadow-indigo-900/40 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">Team Visibility</p>
              <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">Daily Roster</h1>
            </div>
          </div>
          <button
            onClick={() => exportToCSV(filteredRoster, `roster_${selectedDateStr}.csv`)}
            className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 text-xs font-bold text-white ring-1 ring-white/20 backdrop-blur-sm transition-all hover:bg-white/25 active:scale-95"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── DATE NAVIGATION (separate row so calendar popup isn't clipped) ── */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button onClick={() => shiftDate(-1)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 active:scale-95 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 [&_button]:!rounded-2xl [&_button]:!border-gray-200 [&_button]:!shadow-sm [&_button]:!font-bold dark:[&_button]:!border-gray-800 dark:[&_button]:!bg-gray-900 [&_label]:!hidden">
          <DatePickerField value={selectedDateStr} onChange={(v) => { setSelectedDateStr(v); setCurrentPage(0); }} />
        </div>
        {isToday && <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600 shrink-0 dark:bg-emerald-950/30 dark:text-emerald-400">Today</span>}
        <button onClick={() => shiftDate(1)} disabled={isToday} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-30 active:scale-95 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* ── STATS ROW ───────────────────────────────────────────────── */}
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

      {/* ── SEARCH + FILTER BAR ─────────────────────────────────────── */}
      <div className={`grid gap-3 md:items-center ${canFilterDepartment ? "md:grid-cols-[minmax(0,1fr)_190px_190px_190px]" : "md:grid-cols-[minmax(0,1fr)_190px_190px]"}`}>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Quick search name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl bg-white py-3.5 pl-11 pr-4 text-sm font-medium text-gray-900 placeholder-gray-400 shadow-sm outline-none ring-1 ring-gray-200 focus:ring-indigo-500/50 dark:bg-gray-900 dark:text-white dark:placeholder-slate-500 dark:ring-gray-800"
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

      {/* ── DATA AREA ───────────────────────────────────────────────── */}
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
                      <td className="px-6 py-4"><AttendanceBadge status={item.attendanceStatus} isLate={item.late} /></td>
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
