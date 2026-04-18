import { useEffect, useState } from "react";
import {
  Users, Search,
  Clock, AlertCircle,
  ChevronLeft, ChevronRight, RefreshCw,
  Wifi
} from "lucide-react";
import { useAppToast } from "../../components/ui/ToastProvider";
import api from "../../api/axios";

interface AttendanceRosterItem {
  id: number;
  fullName: string;
  employeeCode: string;
  attendanceStatus: string;
  punchInTime: string | null;
  punchOutTime: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────
function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatTime(iso: string | null) {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function toDateString(d: Date) {
  return d.toISOString().split("T")[0];
}

// ── Status Badge (Premium Soft) ───────────────────────────────────
function AttendanceBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PRESENT: { label: "Present", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/60" },
    LATE: { label: "Late", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60" },
    ABSENT: { label: "Absent", cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800/60" },
    ON_LEAVE: { label: "On Leave", cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800/60" },
  };
  const cfg = map[status] ?? { label: status.replaceAll("_", " "), cls: "bg-gray-100 text-gray-600 ring-1 ring-gray-200/60 dark:bg-gray-800 dark:text-gray-300" };
  return (
    <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-3xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-2.5 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-7 w-16 rounded-xl bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="mt-4 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800/50" />
    </div>
  );
}

// ── Mobile Card ───────────────────────────────────────────────────
function RosterCard({ item }: { item: AttendanceRosterItem }) {
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
      {/* Status accent strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${strip}`} />

      <div className="flex flex-col gap-3.5 p-5 pl-6">
        {/* Top row: Avatar + Name + Badge */}
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

        {/* Bottom row: Punch times */}
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

// ── Main Component ────────────────────────────────────────────────
export default function DailyRoster() {
  const [roster, setRoster] = useState<AttendanceRosterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { pushToast } = useAppToast();

  useEffect(() => {
    fetchRoster();
  }, [selectedDate]);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const today = toDateString(selectedDate);
      const response = await api.get(`/api/v1/attendance/roster?date=${today}`);
      setRoster(response.data);
    } catch (error) {
      pushToast({ title: "Fetch Error", message: "Failed to load team roster", tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  const isToday = toDateString(selectedDate) === toDateString(new Date());

  const filteredRoster = roster.filter((item) => {
    const matchesSearch =
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "ALL" || item.attendanceStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: roster.length,
    present: roster.filter((r) => r.attendanceStatus === "PRESENT").length,
    late: roster.filter((r) => r.attendanceStatus === "LATE").length,
    absent: roster.filter((r) => r.attendanceStatus === "ABSENT").length,
  };

  const FILTERS = ["ALL", "PRESENT", "LATE", "ABSENT", "ON_LEAVE"] as const;

  const filterLabel: Record<string, string> = {
    ALL: "All",
    PRESENT: "Present",
    LATE: "Late",
    ABSENT: "Absent",
    ON_LEAVE: "On Leave",
  };

  return (
    <div className="mx-auto w-full max-w-6xl overflow-hidden space-y-6 px-4 sm:px-6 md:px-8">

      {/* ═══════════════════════════════════════════════════════════
          MISSION 1 — DATE NAVIGATOR HERO
      ═══════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 shadow-xl shadow-slate-900/30 md:p-8">
        <div className="flex flex-col gap-6">
          {/* Top: Icon + Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Attendance
                </p>
                <h1 className="text-xl font-black tracking-tight text-white md:text-2xl">
                  Daily Roster
                </h1>
              </div>
            </div>

            <button
              onClick={() => fetchRoster()}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 transition-all hover:bg-white/20 active:scale-95"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 text-white ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => shiftDate(-1)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 transition-all hover:bg-white/20 active:scale-95"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>

            <div className="flex flex-1 flex-col items-center">
              <p className="text-2xl font-black tracking-tight text-white md:text-3xl">
                {selectedDate.toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric" })}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-400">
                  {selectedDate.getFullYear()}
                </span>
                {isToday && (
                  <span className="rounded-lg bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 ring-1 ring-emerald-500/30">
                    Today
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => shiftDate(1)}
              disabled={isToday}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 transition-all hover:bg-white/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Stat pills */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center rounded-2xl bg-emerald-500/15 py-3 ring-1 ring-emerald-500/25">
              <span className="text-2xl font-black tabular-nums text-emerald-400">{stats.present}</span>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-500/70">Present</span>
            </div>
            <div className="flex flex-col items-center rounded-2xl bg-amber-500/15 py-3 ring-1 ring-amber-500/25">
              <span className="text-2xl font-black tabular-nums text-amber-400">{stats.late}</span>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Late</span>
            </div>
            <div className="flex flex-col items-center rounded-2xl bg-rose-500/15 py-3 ring-1 ring-rose-500/25">
              <span className="text-2xl font-black tabular-nums text-rose-400">{stats.absent}</span>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-rose-500/70">Absent</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SEARCH + FILTER BAR
      ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or employee code…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-gray-100 bg-white py-3 pl-11 pr-4 text-sm font-medium placeholder-gray-400 transition-all focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:placeholder-gray-600"
          />
        </div>

        {/* Filter tabs — scrollable on mobile */}
        <div className="w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2 rounded-2xl bg-gray-100/80 p-1.5 dark:bg-gray-900/60">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`
                  flex min-h-[44px] min-w-[44px] items-center justify-center whitespace-nowrap rounded-xl px-4 text-xs font-bold transition-all duration-150
                  ${filter === f
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-400"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  }
                `}
              >
                {filterLabel[f]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION LABEL
      ═══════════════════════════════════════════════════════════ */}
      {!loading && filteredRoster.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">
            {filteredRoster.length} {filteredRoster.length === 1 ? "Employee" : "Employees"}
          </p>
          <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MISSION 2 — MOBILE CARDS (md:hidden)
      ═══════════════════════════════════════════════════════════ */}
      <div className="md:hidden">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 py-20 text-center dark:border-gray-800 dark:bg-gray-900/30">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-gray-300 dark:text-gray-700" />
            <p className="text-base font-bold text-gray-700 dark:text-gray-300">No records found</p>
            <p className="mt-1 text-sm text-gray-400">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRoster.map((item) => (
              <RosterCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MISSION 3 — DESKTOP DATA GRID (hidden md:block)
      ═══════════════════════════════════════════════════════════ */}
      <div className="hidden md:block overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-gray-400">Syncing Roster…</p>
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-gray-300" />
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300">No records found</p>
            <p className="mt-1 text-sm text-gray-400">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="px-7 py-4 text-left text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                  Employee
                </th>
                <th className="px-7 py-4 text-left text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                  Status
                </th>
                <th className="px-7 py-4 text-left text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                  Punch In
                </th>
                <th className="px-7 py-4 text-left text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                  Punch Out
                </th>
                <th className="px-7 py-4 text-left text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                  Verification
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {filteredRoster.map((item) => {
                const initials = getInitials(item.fullName);
                const avatarColor: Record<string, string> = {
                  PRESENT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
                  LATE: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
                  ABSENT: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
                  ON_LEAVE: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
                };
                const avatarCls = avatarColor[item.attendanceStatus] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";

                return (
                  <tr
                    key={item.id}
                    className="group transition-colors duration-100 hover:bg-gray-50/70 dark:hover:bg-white/[0.03]"
                  >
                    {/* Employee */}
                    <td className="px-7 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-black transition-all ${avatarCls}`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                            {item.fullName}
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400/70">
                            {item.employeeCode}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-7 py-4">
                      <AttendanceBadge status={item.attendanceStatus} />
                    </td>

                    {/* Punch In */}
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="text-sm font-semibold tabular-nums text-gray-700 dark:text-gray-300">
                          {formatTime(item.punchInTime)}
                        </span>
                      </div>
                    </td>

                    {/* Punch Out */}
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="text-sm font-semibold tabular-nums text-gray-700 dark:text-gray-300">
                          {formatTime(item.punchOutTime)}
                        </span>
                      </div>
                    </td>

                    {/* Verification */}
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-2.5 py-1.5 w-fit dark:bg-emerald-950/30">
                        <Wifi className="h-3 w-3 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Office Wifi
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Table footer */}
        {!loading && filteredRoster.length > 0 && (
          <div className="border-t border-gray-50 px-7 py-4 dark:border-gray-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              {filteredRoster.length} of {stats.total} employees shown
            </p>
          </div>
        )}
      </div>
    </div>
  );
}