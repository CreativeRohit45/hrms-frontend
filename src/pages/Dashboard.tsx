import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats, type DashboardStats } from "../api/dashboard";
import { punchIn, punchOut } from "../api/attendance";
import { getTeamAvailability, getDepartmentAbsentees } from "../api/leaves";
import type { TeamMemberOnLeave, DepartmentAbsenteeDTO } from "../types/leave";
import {
  AlertCircle,
  Calendar,
  Clock,
  FileClock,
  MapPin,
  Palmtree,
  Receipt,
  ShieldAlert,
  UserCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/ui/EmptyState";
import { InlineInfoPanel } from "../components/ui/InlineInfoPanel";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { StatusBadge } from "../components/ui/StatusBadge";

type QuickAction = {
  label: string;
  description: string;
  to: string;
};

const EMPLOYEE_ACTIONS: QuickAction[] = [
  { label: "View attendance", description: "Check your month, roster, and regularization status.", to: "/app/attendance" },
  { label: "Apply leave", description: "Create a leave request with balance preview.", to: "/app/leaves" },
  { label: "Request gatepass", description: "Manage short exits and return tracking.", to: "/app/gatepasses" },
  { label: "Open payslips", description: "Review payroll history and downloadable slips.", to: "/app/my-payslips" },
];

const MANAGER_ACTIONS: QuickAction[] = [
  { label: "Review attendance", description: "Open team attendance, roster, and corrections.", to: "/app/attendance" },
  { label: "Open requests", description: "Handle leave and gatepass approvals quickly.", to: "/app/leaves" },
  { label: "View employees", description: "Browse the people directory and profiles.", to: "/app/employees" },
  { label: "Payroll workspace", description: "Check payroll visibility and monthly status.", to: "/app/payroll" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const isManager = user?.role === "SUPER_ADMIN" || user?.role === "HR_ADMIN" || user?.role === "DEPARTMENT_MANAGER";
  const quickActions = isManager ? MANAGER_ACTIONS : EMPLOYEE_ACTIONS;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchError, setPunchError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [teamOnLeave, setTeamOnLeave] = useState<TeamMemberOnLeave[]>([]);
  const [absentees, setAbsentees] = useState<DepartmentAbsenteeDTO[]>([]);

  useEffect(() => {
    void fetchDashboard();
    if (isManager) {
      void fetchTeamAvailability();
    }
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [isManager]);

  async function fetchDashboard() {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load dashboard", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeamAvailability() {
    try {
      const [onLeave, currentAbsentees] = await Promise.all([
        getTeamAvailability(),
        getDepartmentAbsentees(),
      ]);
      setTeamOnLeave(onLeave);
      setAbsentees(currentAbsentees);
    } catch (error) {
      console.error("Failed to load team availability", error);
    }
  }

  function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (err) => {
          switch (err.code) {
            case err.PERMISSION_DENIED:
              reject(new Error("Location permission denied. Please allow browser location access to punch in."));
              break;
            case err.POSITION_UNAVAILABLE:
              reject(new Error("Unable to determine your location. Please check GPS or network settings."));
              break;
            case err.TIMEOUT:
              reject(new Error("Location request timed out. Please try again."));
              break;
            default:
              reject(new Error("Unknown location error."));
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }

  async function handlePunch() {
    if (!stats) return;
    setPunchLoading(true);
    setPunchError(null);
    try {
      const { lat, lng } = await getCurrentPosition();
      const session = stats.currentSession;
      if (session?.active) {
        await punchOut(lat, lng);
      } else {
        await punchIn(lat, lng);
      }
      await fetchDashboard();
    } catch (error: any) {
      console.error("Punch action failed:", error);
      if (error?.response?.status === 403 && error?.response?.data?.error === "LOCATION_VERIFICATION_FAILED") {
        const data = error.response.data;
        const distKm = (data.distanceMeters / 1000).toFixed(1);
        const allowedKm = (data.allowedMeters / 1000).toFixed(1);
        setPunchError(`You are ${distKm} km from the office. You must be within ${allowedKm} km to punch in.`);
      } else if (error?.response?.status === 409) {
        setPunchError(error?.response?.data?.message || "Session conflict. Please refresh.");
      } else if (error instanceof Error && error.message.includes("Location")) {
        setPunchError(error.message);
      } else {
        setPunchError("Punch failed. Please check your connection and try again.");
      }
    } finally {
      setPunchLoading(false);
    }
  }

  const sessionTone = stats?.currentSession?.active ? "success" : stats?.todayCompleted ? "info" : "warning";
  const sessionLabel = stats?.currentSession?.active ? "Live shift" : stats?.todayCompleted ? "Completed" : "Ready to start";
  const currentDateLabel = currentTime.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const currentClockLabel = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const recentActivity = useMemo(() => stats?.recentLogs.slice(0, 5) ?? [], [stats]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center animate-pulse">
        <div className="text-sm font-medium text-gray-400 dark:text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <EmptyState
        title="Dashboard unavailable"
        description="We could not load your dashboard data right now. Please refresh and try again."
        icon={<AlertCircle className="h-6 w-6" />}
      />
    );
  }

  const isActive = stats.currentSession?.active;
  const todaySummary = isActive && stats.currentSession
    ? `Clocked in at ${new Date(stats.currentSession.punchInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : stats.todayCompleted
      ? `Logged ${formatMinutesLabel(stats.todayTotalMinutes)} today`
      : "Ready to record today's attendance";

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 pb-12">
      <PageHeader
        title="Dashboard"
        subtitle={currentDateLabel}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge label={sessionLabel} tone={sessionTone} />
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Local time</p>
              <p className="mt-1 font-mono text-lg font-bold text-gray-900 dark:text-white">{currentClockLabel}</p>
            </div>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Present days"
          value={stats.presentDays}
          subtitle={`${stats.lateDays} late arrivals this month`}
          icon={<UserCheck size={22} />}
          tone="success"
        />
        <StatCard
          title="Absent days"
          value={stats.absentDays}
          subtitle={`${stats.leaveDays} days were covered by leave`}
          icon={<AlertCircle size={22} />}
          tone="danger"
        />
        <StatCard
          title="Leave remaining"
          value={stats.leavesRemaining}
          subtitle={`${stats.leavesTaken} of ${stats.totalLeaveQuota} used`}
          icon={<Palmtree size={22} />}
          tone="warning"
        />
        <StatCard
          title="Today"
          value={stats.todayCompleted ? formatMinutesLabel(stats.todayTotalMinutes) : isActive ? formatDuration(stats.currentSession?.punchInTime ?? "") : "Not started"}
          subtitle={todaySummary}
          icon={<Clock size={22} />}
          tone="info"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-8">
          <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Attendance action center</h2>
                  <StatusBadge label={sessionLabel} tone={sessionTone} />
                </div>
                <p className="max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                  {stats.todayCompleted && !isActive
                    ? `Your workday is already complete. Total recorded time: ${formatMinutesLabel(stats.todayTotalMinutes)}.`
                    : isActive
                      ? `Your shift is active. Keep location services enabled and punch out before leaving the office.`
                      : "Use punch in to start your workday. The system verifies your location before attendance is recorded."}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <MiniMetric label="Current status" value={sessionLabel} />
                  <MiniMetric label="Today's summary" value={todaySummary} />
                  <MiniMetric label="Upcoming holidays" value={`${stats.upcomingHolidays.length} scheduled`} />
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 rounded-[28px] bg-gray-50 p-6 text-center dark:bg-gray-950/40">
                <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {isActive ? "Shift elapsed" : stats.todayCompleted ? "Workday status" : "Ready to punch"}
                </div>
                <div className="font-mono text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                  {isActive ? formatDuration(stats.currentSession?.punchInTime ?? "") : stats.todayCompleted ? formatMinutesLabel(stats.todayTotalMinutes) : currentClockLabel}
                </div>
                {stats.todayCompleted && !isActive ? (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <UserCheck size={28} />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handlePunch}
                    disabled={punchLoading}
                    className={`rounded-full px-8 py-4 text-sm font-bold text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                      isActive ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                    }`}
                  >
                    {punchLoading ? "Working..." : isActive ? "Punch Out" : "Punch In"}
                  </button>
                )}
              </div>
            </div>

            {punchError && (
              <div className="mt-6">
                <InlineInfoPanel
                  tone="warning"
                  title="Location check failed"
                  message={punchError}
                  icon={<MapPin className="h-4 w-4" />}
                />
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick actions</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Common tasks placed in one consistent workspace.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="rounded-3xl border border-gray-200 bg-gray-50/70 p-5 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-gray-800 dark:bg-gray-950/30 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20"
                >
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{action.label}</p>
                  <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">{action.description}</p>
                </Link>
              ))}
            </div>
          </section>

          {isManager && (
            <section className="rounded-[28px] border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Team pulse</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Department visibility for absences and approved time off.</p>
              </div>
              <div className="p-6">
                {absentees.length === 0 ? (
                  <EmptyState
                    title="Everyone is accounted for"
                    description="No unattended absences are recorded for your department today."
                    icon={<Users className="h-6 w-6" />}
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {absentees.map((person) => (
                      <div key={person.employeeCode} className="rounded-3xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-950/30">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{person.fullName}</p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{person.departmentName}</p>
                          </div>
                          <StatusBadge label={person.status === "ON_LEAVE" ? (person.leaveTypeCode || "On leave") : "Absent"} tone={person.status === "ON_LEAVE" ? "info" : "danger"} />
                        </div>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                          {person.employeeCode}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-8">
          <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming holidays</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Public breaks and company-wide closures.</p>
              </div>
              <Calendar className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="mt-5 space-y-4">
              {stats.upcomingHolidays.length > 0 ? (
                stats.upcomingHolidays.slice(0, 4).map((holiday) => (
                  <div key={`${holiday.date}-${holiday.name}`} className="flex gap-4 rounded-3xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-950/30">
                    <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-gray-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        {new Date(holiday.date).toLocaleDateString(undefined, { month: "short" })}
                      </span>
                      <span className="text-lg font-black text-gray-900 dark:text-white">{new Date(holiday.date).getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{holiday.name}</p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{holiday.description || "Public holiday"}</p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No upcoming holidays"
                  description="Add holiday configuration in settings to show upcoming public breaks here."
                  icon={<Calendar className="h-6 w-6" />}
                />
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Leave balances</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">A consistent balance summary with per-type usage.</p>
              </div>
              <Palmtree className="h-5 w-5 text-amber-500" />
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                  <span>Used {stats.leavesTaken}</span>
                  <span>Total {stats.totalLeaveQuota}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-2 rounded-full bg-amber-500"
                    style={{ width: `${stats.totalLeaveQuota > 0 ? (stats.leavesTaken / stats.totalLeaveQuota) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {stats.leaveBalances.length > 0 ? (
                <div className="space-y-4">
                  {stats.leaveBalances.map((balance) => (
                    <div key={balance.leaveTypeCode}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{balance.leaveTypeName}</span>
                        <span className="font-mono font-bold text-gray-900 dark:text-white">{balance.balance}/{balance.allocated}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-2 rounded-full bg-indigo-500/70"
                          style={{ width: `${balance.allocated > 0 ? (balance.used / balance.allocated) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No balances allocated"
                  description="Once leave allocation is configured, this breakdown will appear here."
                  icon={<Palmtree className="h-6 w-6" />}
                />
              )}
            </div>
          </section>

          {isManager && (
            <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Team time off</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Approved leave already scheduled in your department.</p>
                </div>
                <Users className="h-5 w-5 text-violet-500" />
              </div>
              <div className="mt-5 space-y-3">
                {teamOnLeave.length === 0 ? (
                  <EmptyState
                    title="No approved time off"
                    description="Your department has no approved leave scheduled right now."
                    icon={<Users className="h-6 w-6" />}
                  />
                ) : (
                  teamOnLeave.map((member, index) => (
                    <div key={`${member.employeeCode}-${index}`} className="rounded-3xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-950/30">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{member.fullName}</p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{member.employeeCode}</p>
                        </div>
                        <StatusBadge label={member.leaveTypeCode} tone="info" />
                      </div>
                      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                        {formatDateRange(member.startDate, member.endDate, member.halfDay)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent activity</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Latest attendance records for quick scanning.</p>
              </div>
              <FileClock className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="mt-5 space-y-3">
              {recentActivity.length === 0 ? (
                <EmptyState
                  title="No recent records"
                  description="Recent attendance history will appear here after punch activity is recorded."
                  icon={<FileClock className="h-6 w-6" />}
                />
              ) : (
                recentActivity.map((log) => (
                  <div key={`${log.date}-${log.status}`} className="rounded-3xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-950/30">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatShortDate(log.date)}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          In {log.punchIn ? formatTimeValue(log.punchIn) : "--"} and out {log.punchOut ? formatTimeValue(log.punchOut) : "--"}
                        </p>
                      </div>
                      <StatusBadge label={log.status.replaceAll("_", " ")} tone={getLogTone(log.status)} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {!isManager && (
        <InlineInfoPanel
          tone="info"
          title="Mobile-first note"
          message="This layout keeps your core employee actions close together so the same structure can translate cleanly into the upcoming mobile app."
          icon={<Receipt className="h-4 w-4" />}
        />
      )}

      {isManager && (
        <InlineInfoPanel
          tone="info"
          title="Manager visibility"
          message="Team Pulse and Team Time Off are intentionally separated from your personal attendance actions so the dashboard stays easier to scan on both web and mobile."
          icon={<ShieldAlert className="h-4 w-4" />}
        />
      )}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/30">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function formatDuration(startTime: string) {
  if (!startTime) return "00:00:00";
  const start = new Date(startTime).getTime();
  const now = new Date().getTime();
  const diff = Math.max(0, now - start);
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatMinutesLabel(minutes: number | null) {
  if (!minutes || minutes <= 0) return "0h 0m";
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function formatTimeValue(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatShortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDateRange(startDate: string, endDate: string, halfDay?: boolean) {
  const start = formatShortDate(startDate);
  const end = formatShortDate(endDate);
  if (startDate === endDate) {
    return halfDay ? `${start} (Half day)` : start;
  }
  return `${start} to ${end}`;
}

function getLogTone(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (status) {
    case "PRESENT":
      return "success";
    case "LATE":
      return "warning";
    case "ABSENT":
      return "danger";
    case "ON_LEAVE":
    case "HOLIDAY":
      return "info";
    default:
      return "neutral";
  }
}
