import React, { useMemo, useState } from "react";
import { punchIn, punchOut } from "../api/attendance";
import { getServerNow } from "../utils/serverTime";
import {
  AlertCircle,
  Clock,
  UserCheck,
  Users,
  Timer,
  CalendarDays,
  X,
  Plus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/ui/EmptyState";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAppToast } from "../components/ui/ToastProvider";
import { SkeletonCard, SkeletonTable } from "../components/ui/Skeletons";
import { useDashboardStats, useDepartmentAbsentees } from "../hooks/queries/useDashboard";
import { queryClient } from "../lib/queryClient";
import { queryKeys } from "../lib/queryKeys";
import { LeaveBalanceWidget } from "../components/dashboard/LeaveBalanceWidget";

export default function Dashboard() {
  const { user } = useAuth();
  const { pushToast } = useAppToast();

  const { data: stats, isLoading: loading } = useDashboardStats();
  const { data: absentees = [] } = useDepartmentAbsentees();

  const [punchLoading, setPunchLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock — the only remaining interval, not a data-fetch concern
  React.useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function handlePunch() {
    if (!stats) return;
    setPunchLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((res, rej) => 
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000 })
      );
      
      const { latitude: lat, longitude: lng } = position.coords;
      const isActive = stats.currentSession?.active;
      
      if (isActive) {
        await punchOut(lat, lng);
        pushToast({ title: "Punched Out", message: "Workday record saved.", tone: "success" });
      } else {
        await punchIn(lat, lng);
        pushToast({ title: "Punched In", message: "Shift started.", tone: "success" });
      }
      // Invalidate the cache — TanStack Query will refetch in the background
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    } catch (error: any) {
      pushToast({ 
        title: "Punch Failed", 
        message: error?.response?.data?.message || "Location verification failed.", 
        tone: "error" 
      });
    } finally {
      setPunchLoading(false);
    }
  }

  const clockLabel = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateLabel = currentTime.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const workedHoursLabel = useMemo(() => {
    if (!stats?.totalWorkedMinutes) return "0h 0m";
    const h = Math.floor(stats.totalWorkedMinutes / 60);
    const m = stats.totalWorkedMinutes % 60;
    return `${h}h ${m}m`;
  }, [stats]);

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700/60" />
          <div className="h-4 w-48 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800/60" />
        </div>
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        {/* Punch card skeleton */}
        <div className="animate-pulse rounded-3xl border border-gray-100 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-48 rounded-xl bg-gray-200 dark:bg-gray-700/60" />
            <div className="h-14 w-14 rounded-full bg-gray-200 dark:bg-gray-700/60" />
            <div className="h-4 w-32 rounded-md bg-gray-100 dark:bg-gray-800/60" />
          </div>
        </div>
        <SkeletonTable rows={3} columns={4} />
      </div>
    );
  }

  if (!stats) return <EmptyState title="Sync Broken" description="Could not load dashboard stats." />;

  const isActive = stats.currentSession?.active;

  return (
    <div className="space-y-8">
      
      {/* ROW 1: HEADER & CLOCK */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Welcome back, <span className="text-indigo-600 dark:text-indigo-400">{user?.fullName?.split(' ')[0]}</span>
          </h1>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500">{dateLabel}</p>
        </div>
        
        <div className="inline-flex items-center self-start md:self-auto gap-2.5 rounded-2xl border border-gray-100 bg-white p-1.5 pl-3.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <Clock className="h-3.5 w-3.5 text-indigo-500" />
          <div className="rounded-xl bg-gray-50 px-3 py-1.5 font-mono text-sm font-black text-gray-900 dark:bg-gray-800 dark:text-white">
            {clockLabel}
          </div>
        </div>
      </div>

      {/* ROW 2: MONTHLY STATS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Days Present" value={stats.presentDays} icon={<UserCheck className="h-4 w-4" />} />
        <MetricCard label="Days Absent" value={stats.absentDays} icon={<AlertCircle className="h-4 w-4" />} tone="danger" />
        <MetricCard label="Days Late" value={stats.lateDays} icon={<Clock className="h-4 w-4" />} tone="warning" />
        <MetricCard label="Worked This Month" value={workedHoursLabel} icon={<Timer className="h-4 w-4" />} tone="success" />
      </div>

      {/* ROW 3: ACTION & BALANCES */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* PUNCH HERO CARD */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 transition-all hover:shadow-xl hover:shadow-indigo-500/5 dark:border-gray-800 dark:bg-gray-900">
          <div className="absolute right-0 top-0 -mr-12 -mt-12 h-32 w-32 rounded-full bg-indigo-50/50 blur-3xl dark:bg-indigo-900/10" />
          
          <div className="relative flex h-full flex-col justify-between space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Daily Attendance</h2>
                <p className="text-xs font-medium text-gray-500">Log your shift activity</p>
              </div>
              <StatusBadge 
                label={isActive ? "Active" : "Offline"} 
                tone={isActive ? "success" : "neutral"} 
              />
            </div>

            <div className="flex flex-col items-center justify-center space-y-2 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                {isActive ? "Elapsed Time" : "Current Time"}
              </p>
              <div className={`font-mono text-5xl font-black tracking-tighter ${isActive ? 'text-indigo-600' : 'text-gray-900 dark:text-white'}`}>
                {isActive ? formatDuration(stats.currentSession?.punchInTime ?? "") : clockLabel}
              </div>
            </div>

            <button
              onClick={handlePunch}
              disabled={punchLoading}
              className={`
                group relative flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-xs font-black uppercase tracking-widest text-white transition-all active:scale-95 disabled:opacity-50
                ${isActive ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'}
              `}
            >
              {punchLoading ? "Updating..." : isActive ? (
                <><X className="h-4 w-4" /> Punch Out</>
              ) : (
                <><Plus className="h-4 w-4" /> Punch In</>
              )}
            </button>
          </div>
        </div>

        {/* LEAVE BALANCES */}
        <LeaveBalanceWidget />
      </div>

      {/* ROW 4: AWARENESS */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* TEAM ON LEAVE */}
        <div className="flex flex-col rounded-3xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4 dark:border-gray-800">
            <div className="space-y-0.5">
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Team on Leave</h2>
              <p className="text-xs font-medium text-gray-500">Currently away on approved leave</p>
            </div>
            <Users className="h-5 w-5 text-indigo-400" />
          </div>
          
          <div className="mt-4 space-y-3">
            {absentees.filter(p => p.status === "ON_LEAVE").length > 0 ? 
              absentees.filter(p => p.status === "ON_LEAVE").map((p) => (
              <div key={p.employeeCode} className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-bold text-indigo-600 dark:bg-gray-700">
                    {p.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{p.fullName}</p>
                    <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">
                      {p.leaveTypeCode || "On Leave"}
                    </p>
                  </div>
                </div>
                <StatusBadge label={p.leaveTypeCode || "ON LEAVE"} tone="info" />
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-xs font-medium text-gray-400 italic">No team members are on leave today.</p>
              </div>
            )}
          </div>
        </div>

        {/* HOLIDAYS */}
        <div className="flex flex-col rounded-3xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4 dark:border-gray-800">
            <div className="space-y-0.5">
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Holidays</h2>
              <p className="text-xs font-medium text-gray-500">Upcoming company breaks</p>
            </div>
            <CalendarDays className="h-5 w-5 text-indigo-400" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {stats.upcomingHolidays.map((h) => (
              <div key={h.date} className="flex flex-col items-center justify-center rounded-xl border border-gray-50 bg-white p-3 text-center dark:border-gray-800 dark:bg-gray-900">
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">
                  {new Date(h.date).toLocaleDateString(undefined, { month: 'short' })}
                </p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {new Date(h.date).getDate()}
                </p>
                <p className="mt-1 text-[10px] font-bold truncate w-full">{h.name}</p>
              </div>
            ))}
          </div>
          {stats.upcomingHolidays.length === 0 && (
             <p className="py-6 text-center text-xs font-medium text-gray-400 italic">No upcoming holidays.</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: "info" | "danger" | "warning" | "success";
}

function MetricCard({ label, value, icon, tone = "info" }: MetricCardProps) {
  const bgColors: Record<string, string> = {
    info: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
    danger: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bgColors[tone]}`}>
          {icon}
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</p>
          <p className="text-xl font-black text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function formatDuration(startTime: string) {
  if (!startTime) return "00:00:00";
  const start = new Date(startTime).getTime();
  const now = getServerNow().getTime();
  const diff = Math.max(0, now - start);
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
