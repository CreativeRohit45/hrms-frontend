import { useEffect, useState } from "react";
import { 
  Users, CalendarDays, Search, 
  Clock, MapPin, AlertCircle,
  UserCheck2, UserMinus2, UserX2
} from "lucide-react";
import { useAppToast } from "../../components/ui/ToastProvider";
import api from "../../api/axios";
import { StatusBadge } from "../../components/ui/StatusBadge";

interface AttendanceRosterItem {
  id: number;
  fullName: string;
  employeeCode: string;
  attendanceStatus: string;
  punchInTime: string | null;
  punchOutTime: string | null;
}

export default function DailyRoster() {
  const [roster, setRoster] = useState<AttendanceRosterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
  const { pushToast } = useAppToast();

  useEffect(() => {
    fetchRoster();
  }, []);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get(`/api/v1/attendance/roster?date=${today}`);
      setRoster(response.data);
    } catch (error) {
      pushToast({ title: "Fetch Error", message: "Failed to load team roster", tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  const filteredRoster = roster.filter(item => {
    const matchesSearch = item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "ALL" || item.attendanceStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: roster.length,
    present: roster.filter(r => r.attendanceStatus === "PRESENT").length,
    late: roster.filter(r => r.attendanceStatus === "LATE").length,
    absent: roster.filter(r => r.attendanceStatus === "ABSENT").length,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* HEADER & STATS */}
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
               <Users className="h-6 w-6" />
             </div>
             <div>
               <div className="flex items-center gap-2">
                 <h1 className="text-3xl font-black tracking-tight">Daily Roster</h1>
                 <div className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-500 dark:bg-gray-800">
                   <CalendarDays className="h-3 w-3" />
                   {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                 </div>
               </div>
               <p className="text-sm text-gray-500">Live attendance status for your team</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
             <div className="flex items-center justify-between">
               <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Present</p>
               <UserCheck2 className="h-4 w-4 text-emerald-500/50 transition-colors group-hover:text-emerald-500" />
             </div>
             <p className="mt-1 text-2xl font-black text-emerald-500">{stats.present}</p>
          </div>
          <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
             <div className="flex items-center justify-between">
               <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Late</p>
               <UserMinus2 className="h-4 w-4 text-amber-500/50 transition-colors group-hover:text-amber-500" />
             </div>
             <p className="mt-1 text-2xl font-black text-amber-500">{stats.late}</p>
          </div>
          <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
             <div className="flex items-center justify-between">
               <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Absent</p>
               <UserX2 className="h-4 w-4 text-rose-500/50 transition-colors group-hover:text-rose-500" />
             </div>
             <p className="mt-1 text-2xl font-black text-rose-500">{stats.absent}</p>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
          <input 
            type="text"
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border-gray-100 bg-white py-2.5 pl-11 pr-4 text-sm transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-800 dark:bg-gray-900"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {(["ALL", "PRESENT", "LATE", "ABSENT", "ON_LEAVE"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all ${filter === f ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-950/20" : "bg-white text-gray-500 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800"}`}
            >
              {f.replaceAll("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* ROSTER TABLE */}
      <div className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 dark:border-gray-800/50">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Employee</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Punch Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {loading ? (
                <tr><td colSpan={3} className="py-24 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                  <p className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-400">Syncing Roster...</p>
                </td></tr>
              ) : filteredRoster.length === 0 ? (
                <tr><td colSpan={3} className="py-24 text-center">
                  <AlertCircle className="mx-auto h-10 w-10 text-gray-300 mb-4" />
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300">No records today</p>
                  <p className="text-sm text-gray-400">Try adjusting your search or filters.</p>
                </td></tr>
              ) : filteredRoster.map((item) => (
                <tr key={item.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 font-bold text-gray-500 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-gray-800 dark:group-hover:bg-indigo-950/40">
                        {item.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{item.fullName}</p>
                        <p className="text-[10px] font-black uppercase tracking-tighter text-indigo-500/70">{item.employeeCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                       {item.attendanceStatus === 'ABSENT' && <AlertCircle className="h-3 w-3 text-rose-500" />}
                       <StatusBadge 
                        label={item.attendanceStatus.replaceAll("_", " ")} 
                        tone={
                          item.attendanceStatus === "PRESENT" ? "success" :
                          item.attendanceStatus === "LATE" ? "warning" :
                          item.attendanceStatus === "ABSENT" ? "danger" : "info"
                        }
                      />
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-6">
                       <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">In / Out</p>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                               {item.punchInTime ? new Date(item.punchInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                               <span className="mx-1 text-gray-300">•</span>
                               {item.punchOutTime ? new Date(item.punchOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                            </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2 border-l border-gray-100 pl-6 dark:border-gray-800">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Verification</p>
                            <p className="text-xs font-bold text-emerald-500 uppercase tracking-tighter">Office Wifi</p>
                          </div>
                       </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
