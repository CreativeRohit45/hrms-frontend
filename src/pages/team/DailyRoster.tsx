import { useState, useMemo } from "react";
import {
  Users, Search,
  Clock,
  ChevronLeft, ChevronRight,
  Wifi, CalendarDays, Sparkles
} from "lucide-react";
import { useDailyRosterLogs } from "../../hooks/queries/useAttendance";
import { useShifts } from "../../hooks/queries/useSettings";
import { formatTime } from "../../types/attendance";
import { SelectField } from "../../components/ui/SelectField";
import { DatePickerField } from "../../components/ui/DatePickerField";

// ── Helpers ───────────────────────────────────────────────────────
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

// ── Status Badge (Premium Soft) ───────────────────────────────────
function AttendanceBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PRESENT: { label: "Present", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/60" },
    LATE: { label: "Late", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60" },
    ABSENT: { label: "Absent", cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800/60" },
    ON_LEAVE: { label: "On Leave", cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800/60" },
  };
  const cfg = map[status] ?? { 
    label: status?.replaceAll("_", " ") ?? "Unknown", 
    cls: "bg-gray-100 text-gray-600 ring-1 ring-gray-200/60 dark:bg-gray-800 dark:text-gray-300" 
  };
  return (
    <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ── Mobile Card ───────────────────────────────────────────────────
function RosterCard({ item }: { item: any }) {
  const initials = getInitials(item.fullName);

  const avatarColor: Record<string, string> = {
    PRESENT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    LATE: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    ABSENT: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    ON_LEAVE: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  };
  const avatarCls = avatarColor[item.attendanceStatus] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";

  const stripColor: Record<string, string> = {
    PRESENT: "bg-emerald-500",
    LATE: "bg-amber-400",
    ABSENT: "bg-rose-500",
    ON_LEAVE: "bg-blue-500",
  };
  const strip = stripColor[item.attendanceStatus] ?? "bg-gray-300";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-150 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${strip}`} />
      <div className="flex flex-col gap-3.5 p-5 pl-6">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${avatarCls}`}>
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
          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-2.5 py-1 dark:bg-emerald-950/30">
            <Wifi className="h-3 w-3 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Office
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Smart Filter Pill ─────────────────────────────────────────────
function SmartFilterPill({ 
  label, 
  active, 
  onClick, 
  count 
}: { 
  label: string; 
  active: boolean; 
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
        active 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none" 
          : "bg-white text-gray-500 ring-1 ring-inset ring-gray-100 hover:ring-indigo-200 dark:bg-gray-900 dark:text-gray-400 dark:ring-gray-800"
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-lg px-1 text-[10px] ${
          active ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function DailyRoster() {
  const [selectedDateStr, setSelectedDateStr] = useState<string>(toDateString(new Date()));
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShiftId, setSelectedShiftId] = useState<number | "ALL">("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const [smartFilter, setSmartFilter] = useState<"ALL" | "LATE" | "OVERTIME" | "MISPUNCH" | "WEEKEND">("ALL");
  const pageSize = 50;



  const { data: shiftsData } = useShifts();
  const shifts = shiftsData || [];

  const { 
    data: rosterData, 
    isLoading 
  } = useDailyRosterLogs(
    selectedDateStr,
    currentPage,
    pageSize,
    selectedShiftId
  );

  const roster = rosterData?.content || [];
  const totalPages = rosterData?.totalPages || 0;
  const totalElements = rosterData?.totalElements || 0;

  // ── Smart Filter Logic ──────────────────────────────────────────
  const filteredRoster = useMemo(() => {
    let list = roster;
    
    // Search
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(r => r.fullName.toLowerCase().includes(s) || r.employeeCode.toLowerCase().includes(s));
    }

    // Smart Filters
    if (smartFilter === "LATE") {
      list = list.filter(r => r.attendanceStatus === "LATE");
    } else if (smartFilter === "OVERTIME") {
      list = list.filter(r => r.overtime === true);
    } else if (smartFilter === "MISPUNCH") {
      list = list.filter(r => (r.punchInTime && !r.punchOutTime) || (!r.punchInTime && r.punchOutTime));
    } else if (smartFilter === "WEEKEND") {
      list = list.filter(r => r.attendanceStatus === "WEEKEND_WORK");
    }

    return list;
  }, [roster, searchTerm, smartFilter]);

  // Counts for smart filter pills (of current page/shift)
  const smartCounts = useMemo(() => ({
    late: roster.filter(r => r.attendanceStatus === "LATE").length,
    overtime: roster.filter(r => r.overtime === true).length,
    mispunch: roster.filter(r => (r.punchInTime && !r.punchOutTime) || (!r.punchInTime && r.punchOutTime)).length,
    weekend: roster.filter(r => r.attendanceStatus === "WEEKEND_WORK").length,
  }), [roster]);

  const shiftDate = (days: number) => {
    const d = new Date(`${selectedDateStr}T00:00:00`);
    d.setDate(d.getDate() + days);
    setSelectedDateStr(toDateString(d));
    setCurrentPage(0);
  };

  const isToday = selectedDateStr === toDateString(new Date());

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-20 sm:px-6 md:px-8">
      
      {/* ── Compact Header ── */}
      <div className="flex flex-col gap-6 rounded-[2.5rem] bg-slate-900 p-8 shadow-2xl shadow-slate-200 dark:shadow-none">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-indigo-500 shadow-lg shadow-indigo-500/20">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">Daily Roster</h1>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Team Visibility</p>
            </div>
          </div>

          {/* Compact Date Navigation with Calendar Popover */}
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-1.5 ring-1 ring-white/10">
            <button 
              onClick={() => shiftDate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:bg-white/10 text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            {/* Clickable DatePicker with Icon */}
            <div className="flex items-center gap-2 px-1 [&>div>button]:!bg-transparent [&>div>button]:!border-none [&>div>button]:!shadow-none [&>div>button]:!text-white [&>div>button]:!font-black [&>div>button]:!text-sm [&>div>button]:!h-auto [&>div>button]:!px-2 [&>div>button]:!py-1.5 [&>div>button]:!ring-0 [&_label]:!hidden">
              <DatePickerField
                value={selectedDateStr}
                onChange={(v) => { setSelectedDateStr(v); setCurrentPage(0); }}
              />
            </div>
            {isToday && <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">Today</span>}

            <button 
              onClick={() => shiftDate(1)}
              disabled={isToday}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:bg-white/10 text-white disabled:opacity-20"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search & Shift Bar */}
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input 
              type="text"
              placeholder="Quick search name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl bg-white/5 py-3.5 pl-11 pr-4 text-sm font-medium text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-indigo-500/50"
            />
          </div>
          <div className="min-w-[160px] [&_select]:!bg-white/10 [&_select]:!border-white/10 [&_select]:!text-white [&_select]:!shadow-none [&_select]:hover:!border-white/20 [&_select]:focus:!border-indigo-500/50 [&_svg]:!text-white/50">
            <SelectField
              compact
              value={selectedShiftId === "ALL" ? "" : String(selectedShiftId)}
              onChange={(v) => {
                setSelectedShiftId(v === "" ? "ALL" : Number(v));
                setCurrentPage(0);
              }}
              placeholder="All Shifts"
              options={shifts.map(s => ({ label: s.shiftName, value: String(s.id) }))}
            />
          </div>
        </div>
      </div>

      {/* ── Smart Filters ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <SmartFilterPill label="All" active={smartFilter === "ALL"} onClick={() => setSmartFilter("ALL")} />
        <SmartFilterPill label="Late" active={smartFilter === "LATE"} onClick={() => setSmartFilter("LATE")} count={smartCounts.late} />
        <SmartFilterPill label="Overtime" active={smartFilter === "OVERTIME"} onClick={() => setSmartFilter("OVERTIME")} count={smartCounts.overtime} />
        <SmartFilterPill label="Mis-punches" active={smartFilter === "MISPUNCH"} onClick={() => setSmartFilter("MISPUNCH")} count={smartCounts.mispunch} />
        <SmartFilterPill label="Weekend" active={smartFilter === "WEEKEND"} onClick={() => setSmartFilter("WEEKEND")} count={smartCounts.weekend} />
      </div>

      {/* ── Table / Grid ── */}
      <div className="rounded-[2.5rem] border border-gray-100 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900">
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
            {/* Desktop Table */}
            <div className="hidden md:block overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 dark:border-gray-800">
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Employee</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">In / Out</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Overtime</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {filteredRoster.map((item) => (
                    <tr key={item.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-[11px] font-black text-indigo-600 dark:bg-indigo-950/40">
                            {getInitials(item.fullName)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 dark:text-white">{item.fullName}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.employeeCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><AttendanceBadge status={item.attendanceStatus} /></td>
                      <td className="px-6 py-4 font-black tabular-nums text-gray-700 dark:text-gray-300 text-sm">
                        {formatTime(item.punchInTime)} <span className="mx-1 text-gray-300">→</span> {formatTime(item.punchOutTime)}
                      </td>
                      <td className="px-6 py-4">
                        {item.overtime ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2 py-1 text-[10px] font-black text-purple-600 dark:bg-purple-950/40">
                            <Sparkles className="h-3 w-3" />
                            {item.overtimeMinutes}m
                          </span>
                        ) : <span className="text-gray-300 dark:text-gray-700">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <Wifi className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Office</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 p-2">
              {filteredRoster.map(item => <RosterCard key={item.id} item={item} />)}
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-50 px-6 py-4 dark:border-gray-800 sm:flex-row">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Page {currentPage + 1} of {totalPages} ({totalElements} Records)
              </p>
              <div className="flex items-center gap-2">
                <button 
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="rounded-xl border border-gray-100 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 disabled:opacity-30 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400"
                >
                  Prev
                </button>
                <button 
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage(p => p + 1)}
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