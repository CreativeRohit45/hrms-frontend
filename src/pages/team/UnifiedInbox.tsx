import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Inbox,
  MapPin,
  PalmtreeIcon,
  Search,
  Ticket,
  XCircle,
  ChevronLeft,
  ChevronRight,
  SunDim,
  Sunset,
  Clock,
  Calendar,
  AlertTriangle,
  Ban,
  AlertCircle
} from "lucide-react";
import { useAppToast } from "../../components/ui/ToastProvider";
import {
  useApproveCorrection,
  useApproveOvertimeMutation,
  useRejectCorrection,
  useRejectOvertimeMutation,
  useUnifiedInbox,
} from "../../hooks/queries/useAttendance";
import { useApproveLeave, useRejectLeave, useRevokeLeave } from "../../hooks/queries/useLeaves";
import { useApproveGatepass, useRejectGatepass } from "../../hooks/queries/useGatepasses";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { AppModal } from "../../components/ui/AppModal";
import { SelectField } from "../../components/ui/SelectField";
import { FilterSheet, MobileFilterButton } from "../../components/ui/FilterSheet";
import { useDepartments } from "../../hooks/queries/useSettings";
import { useAuth } from "../../context/AuthContext";

interface UnifiedRequest {
  id: string;
  type: "LEAVE" | "GATEPASS" | "CORRECTION" | "OVERTIME";
  employeeName: string;
  employeeCode: string;
  details: string;
  timestamp: string;
  status: string;
  referenceDate: string;
  referenceEndDate?: string;
  departmentId?: number;
  departmentName?: string;
  leaveTypeName?: string;
  appliedDays?: number;
  halfDay?: boolean;
  halfDaySession?: string;
  gatepassType?: string;
  requestedOutTime?: string;
  requestedInTime?: string;
  actualOutTime?: string;
  actualInTime?: string;
  emergency?: boolean;
  originalPunchInTime?: string;
  originalPunchOutTime?: string;
  requestedPunchInTime?: string;
  requestedPunchOutTime?: string;
  overtimeMinutes?: number;
  attendanceStatus?: string;
  rejectionReason?: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(value?: string) {
  if (!value) return "Not available";
  return new Date(value).toLocaleDateString();
}



function formatTime(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatLabel(value?: string) {
  if (!value) return "Not available";
  return value.replaceAll("_", " ");
}

function formatDays(value?: number) {
  if (value == null) return "Not available";
  return `${value} day${value === 1 ? "" : "s"}`;
}

const TYPE_CONFIG = {
  LEAVE: {
    label: "Leave",
    icon: PalmtreeIcon,
    badgeBg: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    strip: "bg-blue-500",
    avatarBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300",
  },
  GATEPASS: {
    label: "Gatepass",
    icon: Ticket,
    badgeBg: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
    strip: "bg-orange-500",
    avatarBg: "bg-orange-100 text-orange-600 dark:bg-orange-900/60 dark:text-orange-300",
  },
  CORRECTION: {
    label: "Correction",
    icon: Clock3,
    badgeBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    strip: "bg-emerald-500",
    avatarBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300",
  },
  OVERTIME: {
    label: "Overtime",
    icon: Clock3,
    badgeBg: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    strip: "bg-purple-500",
    avatarBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/60 dark:text-purple-300",
  },
} as const;

const statusConfig: Record<
  string,
  { icon: React.ReactNode; bg: string; text: string; border: string; label: string; gradient: string }
> = {
  APPROVED: {
    icon: <CheckCircle2 className="h-8 w-8" />,
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800/60",
    label: "Approved",
    gradient: "from-emerald-400 to-teal-500 shadow-emerald-500/20",
  },
  PENDING: {
    icon: <AlertTriangle className="h-8 w-8" />,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800/60",
    label: "Pending Review",
    gradient: "from-amber-400 to-orange-500 shadow-amber-500/20",
  },
  REJECTED: {
    icon: <XCircle className="h-8 w-8" />,
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800/60",
    label: "Rejected",
    gradient: "from-red-500 to-rose-600 shadow-red-500/20",
  },
  CANCELLED: {
    icon: <Ban className="h-8 w-8" />,
    bg: "bg-gray-50 dark:bg-gray-800/40",
    text: "text-gray-500 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-700/60",
    label: "Cancelled",
    gradient: "from-gray-400 to-slate-500 shadow-gray-500/20",
  },
  REVOKED: {
    icon: <AlertCircle className="h-8 w-8" />,
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800/60",
    label: "Revoked by Admin",
    gradient: "from-rose-500 to-pink-600 shadow-rose-500/20",
  },
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {label}
      </span>
      <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function RequestDetailBody({ request }: { request: UnifiedRequest }) {
  const cfg = statusConfig[request.status] ?? statusConfig["PENDING"];
  const typeCfg = TYPE_CONFIG[request.type];
  const Icon = typeCfg.icon;

  return (
    <div className="pb-4">
      <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/40 dark:shadow-black/40">
        {/* ── Status hero ─────────────────────────────────────── */}
        <div className={`relative flex items-center justify-between overflow-hidden bg-gradient-to-br ${cfg.gradient} p-6 sm:p-8 text-white`}>
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-black/10 blur-2xl" />
          
          <div className="relative z-10">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Current Status</p>
            <h2 className="text-3xl sm:text-4xl font-black leading-none tracking-tight">{cfg.label}</h2>
            <div className="mt-4 flex items-center gap-2 rounded-full bg-black/10 px-3 py-1.5 backdrop-blur-md w-max">
              <Icon className="h-4 w-4" />
              <span className="text-[11px] font-black uppercase tracking-widest text-white/90">
                {typeCfg.label} Request
              </span>
            </div>
          </div>

          <div className="relative z-10 flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md ring-4 ring-white/30">
            {cfg.icon}
          </div>
        </div>

        {/* ── Employee banner ─────────────────────────────────── */}
        <div className="flex items-center gap-4 border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/30 sm:px-8">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-black text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300">
            {getInitials(request.employeeName)}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Employee Details</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{request.employeeName}</p>
            <p className="text-xs font-semibold text-gray-500">
              {request.employeeCode} {request.departmentName ? `· ${request.departmentName}` : ""}
            </p>
          </div>
        </div>

        {/* ── Meta grid ───────────────────────────────────────── */}
        <div className="p-6 sm:p-8">
          {request.type === "LEAVE" && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              <DetailRow label="Leave Type" value={request.leaveTypeName ?? "—"} />
              <DetailRow label="Applied Days" value={formatDays(request.appliedDays)} />
              <DetailRow
                label="Start Date"
                value={
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-400" />
                    {formatDate(request.referenceDate)}
                  </span>
                }
              />
              <DetailRow
                label="End Date"
                value={
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-400" />
                    {formatDate(request.referenceEndDate || request.referenceDate)}
                  </span>
                }
              />
              {request.halfDay && (
                <DetailRow
                  label="Half Day"
                  value={
                    <span className="flex items-center gap-2">
                      {request.halfDaySession === "FIRST" ? (
                        <SunDim className="h-4 w-4 text-amber-400" />
                      ) : (
                        <Sunset className="h-4 w-4 text-orange-400" />
                      )}
                      {request.halfDaySession === "FIRST" ? "First Half" : "Second Half"}
                    </span>
                  }
                />
              )}
            </div>
          )}

          {request.type === "GATEPASS" && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              <DetailRow label="Pass Type" value={formatLabel(request.gatepassType)} />
              <DetailRow label="Emergency" value={request.emergency ? "Yes" : "No"} />
              <DetailRow
                label="Exit Time"
                value={
                  request.requestedOutTime ? (
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-indigo-400" />
                      {formatTime(request.requestedOutTime)}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
              <DetailRow
                label="Return Time"
                value={
                  request.requestedInTime ? (
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-indigo-400" />
                      {formatTime(request.requestedInTime)}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
          )}

          {request.type === "CORRECTION" && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              <DetailRow label="Work Date" value={formatDate(request.referenceDate)} />
              <DetailRow label="Status" value={formatLabel(request.attendanceStatus)} />
              <DetailRow
                label="Old Punch In"
                value={
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-400" />
                    {formatTime(request.originalPunchInTime)}
                  </span>
                }
              />
              <DetailRow
                label="New Punch In"
                value={
                  <span className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                    <Clock className="h-4 w-4 text-emerald-500" />
                    {formatTime(request.requestedPunchInTime)}
                  </span>
                }
              />
              <DetailRow
                label="Old Punch Out"
                value={
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-400" />
                    {formatTime(request.originalPunchOutTime)}
                  </span>
                }
              />
              <DetailRow
                label="New Punch Out"
                value={
                  <span className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                    <Clock className="h-4 w-4 text-emerald-500" />
                    {formatTime(request.requestedPunchOutTime)}
                  </span>
                }
              />
            </div>
          )}

          {request.type === "OVERTIME" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <DetailRow label="Work Date" value={formatDate(request.referenceDate)} />
              <DetailRow 
                label="Overtime Duration" 
                value={
                  request.overtimeMinutes != null ? (
                    <span className="text-purple-600 dark:text-purple-400 font-black">
                      {Math.floor(request.overtimeMinutes / 60)}h {request.overtimeMinutes % 60}m
                    </span>
                  ) : "Not available"
                } 
              />
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6 rounded-3xl bg-gray-50 p-6 dark:bg-gray-800/40">
                <DetailRow
                  label="Work Start (Punch In)"
                  value={
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-indigo-400" />
                      {formatTime(request.originalPunchInTime)}
                    </span>
                  }
                />
                <DetailRow
                  label="Work End (Punch Out)"
                  value={
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-indigo-400" />
                      {formatTime(request.originalPunchOutTime)}
                    </span>
                  }
                />
                <DetailRow
                  label="Total Shift Duration"
                  value={
                    request.originalPunchInTime && request.originalPunchOutTime ? (
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {(() => {
                          const diff = new Date(request.originalPunchOutTime).getTime() - new Date(request.originalPunchInTime).getTime();
                          const hours = Math.floor(diff / (1000 * 60 * 60));
                          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                          return `${hours}h ${mins}m`;
                        })()}
                      </span>
                    ) : "—"
                  }
                />
              </div>
            </div>
          )}

          {/* ── Reason / details ────────────────────────────────── */}
          {request.details && (
            <>
              <hr className="my-6 border-dashed border-gray-200 dark:border-gray-800" />
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Reason / Details
                </p>
                <p className="text-sm font-medium leading-relaxed text-gray-700 dark:text-gray-300">
                  {request.details}
                </p>
              </div>
            </>
          )}

          {/* ── Rejection Reason ────────────────────────────────── */}
          {request.rejectionReason && request.status === "REJECTED" && (
            <>
              <hr className="my-6 border-dashed border-gray-200 dark:border-gray-800" />
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Rejection Reason</p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-rose-700 dark:text-rose-300">{request.rejectionReason}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestCard({
  req,
  onAction,
  onOpen,
  isActioning,
}: {
  req: UnifiedRequest;
  onAction: (req: UnifiedRequest, action: "approve" | "reject" | "revoke") => void;
  onOpen: (req: UnifiedRequest) => void;
  isActioning: boolean;
}) {
  const cfg = TYPE_CONFIG[req.type];
  const Icon = cfg.icon;
  const initials = getInitials(req.employeeName);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(req)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(req)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:border-indigo-100 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:hover:border-indigo-900 sm:rounded-3xl"
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${cfg.strip} rounded-l-3xl`} />
      <div className="flex flex-col gap-5 p-5 pl-6 md:flex-row md:items-center md:gap-6 md:py-5 md:pl-7">
        <div className="flex items-center gap-3 md:w-56 md:shrink-0">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${cfg.avatarBg}`}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white">{req.employeeName}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500">{req.employeeCode}</p>
          </div>
        </div>
        <div className="min-w-0 flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${cfg.badgeBg}`}>
              <Icon className="h-3 w-3" />
              {cfg.label}
            </span>
          </div>
          <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-700 dark:text-gray-300">{req.details}</p>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1 whitespace-nowrap">
              <CalendarDays className="h-3 w-3" />
              {new Date(req.timestamp).toLocaleDateString()}
            </span>
            <span className="text-gray-200 dark:text-gray-700">•</span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <MapPin className="h-3 w-3" />
              {req.departmentName || "Department"}
            </span>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:shrink-0">
          {req.status === "PENDING" ? (
            <>
              <button
                disabled={isActioning}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(req, "approve");
                }}
                className="group/approve relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-md shadow-indigo-200/60 transition-all duration-150 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200/80 active:scale-[0.97] disabled:opacity-50 dark:shadow-indigo-900/40 sm:w-auto"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Approve</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover/approve:translate-x-0.5" />
              </button>
              <button
                disabled={isActioning}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(req, "reject");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white px-5 py-3 text-sm font-bold text-gray-500 transition-all duration-150 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-[0.97] disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-rose-900 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 sm:w-auto"
              >
                <XCircle className="h-4 w-4 shrink-0" />
                <span>Reject</span>
              </button>
            </>
          ) : req.status === "APPROVED" && new Date(req.referenceDate + "T00:00:00") >= new Date(new Date().setHours(0,0,0,0)) ? (
            <button
              disabled={isActioning}
              onClick={(e) => {
                e.stopPropagation();
                onAction(req, "revoke");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-3 text-sm font-black text-rose-600 transition-all duration-150 hover:bg-rose-600 hover:text-white active:scale-[0.97] disabled:opacity-50 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900 sm:w-auto"
            >
              <XCircle className="h-4 w-4 shrink-0" />
              <span>Revoke Approval</span>
            </button>
          ) : (
            <div className="flex h-11 items-center px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{req.status}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="absolute inset-y-0 left-0 w-1 rounded-l-3xl bg-gray-200 dark:bg-gray-700" />
      <div className="flex animate-pulse flex-col gap-4 pl-2 md:flex-row md:items-center md:gap-6">
        <div className="flex items-center gap-3 md:w-56">
          <div className="h-11 w-11 rounded-2xl bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-28 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-2.5 w-16 rounded-full bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-5 w-20 rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-full max-w-xs rounded-full bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-11 w-32 rounded-2xl bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

function InboxZero() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-gray-200 bg-gray-50/50 py-24 text-center dark:border-gray-800 dark:bg-gray-900/30">
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl shadow-emerald-200/60 dark:shadow-emerald-900/40">
          <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2} />
        </div>
      </div>
      <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">You&apos;re all caught up!</h2>
      <p className="mt-2 max-w-xs text-sm text-gray-500 dark:text-gray-400">Outstanding work — your team&apos;s requests are all handled.</p>
    </div>
  );
}

const TABS = [
  { key: "PENDING", label: "Pending Requests", icon: Inbox },
  { key: "APPROVED", label: "Approved History", icon: CheckCircle2 },
  { key: "REJECTED", label: "Rejected History", icon: XCircle },
] as const;

export default function UnifiedInbox() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [requestType, setRequestType] = useState<"ALL" | "LEAVE" | "GATEPASS" | "CORRECTION" | "OVERTIME">("ALL");
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UnifiedRequest | null>(null);
  const queryClient = useQueryClient();
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [revokeModal, setRevokeModal] = useState<{ isOpen: boolean; request: UnifiedRequest | null }>({
    isOpen: false,
    request: null,
  });
  const { pushToast } = useAppToast();
  const canFilterDepartment = user?.role === "HR_ADMIN" || user?.role === "SUPER_ADMIN";
  const { data: departments = [] } = useDepartments(canFilterDepartment);

  useEffect(() => {
    setPage(0);
  }, [activeTab, requestType, departmentId]);

  const { data, isLoading } = useUnifiedInbox(
    activeTab,
    requestType === "ALL" ? undefined : requestType,
    canFilterDepartment ? departmentId : undefined,
    page
  );

  const allRequests = useMemo<UnifiedRequest[]>(() => {
    if (!data?.content) return [];
    return data.content.map((item: any) => ({
      id: item.id,
      type: item.requestType as UnifiedRequest["type"],
      employeeName: item.employeeName,
      employeeCode: item.employeeCode,
      details: item.details,
      timestamp: item.createdAt,
      status: item.status,
      referenceDate: item.referenceDate,
      referenceEndDate: item.referenceEndDate,
      departmentId: item.departmentId,
      departmentName: item.departmentName,
      leaveTypeName: item.leaveTypeName,
      appliedDays: item.appliedDays,
      halfDay: item.halfDay,
      halfDaySession: item.halfDaySession,
      gatepassType: item.gatepassType,
      requestedOutTime: item.requestedOutTime,
      requestedInTime: item.requestedInTime,
      actualOutTime: item.actualOutTime,
      actualInTime: item.actualInTime,
      emergency: item.emergency,
      originalPunchInTime: item.originalPunchInTime,
      originalPunchOutTime: item.originalPunchOutTime,
      requestedPunchInTime: item.requestedPunchInTime,
      requestedPunchOutTime: item.requestedPunchOutTime,
      overtimeMinutes: item.overtimeMinutes,
      attendanceStatus: item.attendanceStatus,
      rejectionReason: item.rejectionReason,
    }));
  }, [data]);

  const visibleRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return allRequests;
    return allRequests.filter(
      (req) =>
        req.employeeName.toLowerCase().includes(term) ||
        req.employeeCode.toLowerCase().includes(term) ||
        req.details?.toLowerCase().includes(term)
    );
  }, [allRequests, searchTerm]);

  const approveLeave = useApproveLeave();
  const rejectLeave = useRejectLeave();
  const approveGatepass = useApproveGatepass();
  const rejectGatepass = useRejectGatepass();
  const approveCorrection = useApproveCorrection();
  const rejectCorrection = useRejectCorrection();
  const approveOvertime = useApproveOvertimeMutation("me");
  const rejectOvertime = useRejectOvertimeMutation("me");
  const revokeLeave = useRevokeLeave();

  const handleAction = async (request: UnifiedRequest, action: "approve" | "reject" | "revoke") => {
    if (action === "revoke") {
      setRevokeModal({ isOpen: true, request });
      return;
    }

    const rawId = parseInt(request.id.split("-")[1], 10);
    setActioningId(request.id);
    
    // --- Optimistic UI Update ---
    const queryKey = [
      'attendance', 'inbox', activeTab, 
      requestType === "ALL" ? undefined : requestType, 
      canFilterDepartment ? departmentId : undefined, 
      page
    ];
    
    const previousData = queryClient.getQueryData(queryKey);
    
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData || !oldData.content) return oldData;
      return {
        ...oldData,
        content: oldData.content.filter((req: any) => req.id !== request.id)
      };
    });
    // ----------------------------

    try {
      if (request.type === "LEAVE") {
        if (action === "approve") await approveLeave.mutateAsync(rawId);
        else await rejectLeave.mutateAsync({ leaveId: rawId, data: { rejectionReason: "Manager action" } });
      } else if (request.type === "GATEPASS") {
        if (action === "approve") await approveGatepass.mutateAsync(rawId);
        else await rejectGatepass.mutateAsync({ id: rawId, data: { rejectionReason: "Manager action" } });
      } else if (request.type === "CORRECTION") {
        if (action === "approve") await approveCorrection.mutateAsync(rawId);
        else await rejectCorrection.mutateAsync({ logId: rawId, reason: "Manager action" });
      } else if (request.type === "OVERTIME") {
        if (action === "approve") await approveOvertime.mutateAsync(rawId);
        else await rejectOvertime.mutateAsync(rawId);
      }
      pushToast({ title: "Success", message: `${request.type} ${action}d`, tone: "success" });
    } catch {
      // Rollback on error
      queryClient.setQueryData(queryKey, previousData);
      pushToast({ title: "Error", message: `Failed to ${action} request`, tone: "error" });
    } finally {
      setActioningId(null);
    }
  };

  const confirmRevoke = async () => {
    const request = revokeModal.request;
    if (!request) return;

    const rawId = parseInt(request.id.split("-")[1], 10);
    setActioningId(request.id);
    try {
      await revokeLeave.mutateAsync({ leaveId: rawId, reason: "Revoked by Manager" });
      pushToast({ title: "Success", message: "Leave approval revoked", tone: "success" });
    } catch {
      pushToast({ title: "Error", message: "Failed to revoke approval", tone: "error" });
    } finally {
      setActioningId(null);
      setRevokeModal({ isOpen: false, request: null });
    }
  };

  const requestTypeOptions = [
    { label: "All Requests", value: "ALL" },
    { label: "Leave", value: "LEAVE" },
    { label: "Gatepass", value: "GATEPASS" },
    { label: "Correction", value: "CORRECTION" },
    { label: "Overtime", value: "OVERTIME" },
  ] as const;

  const sheetFilterControls = (
    <>
      <SelectField
        label="Request Type"
        value={requestType}
        onChange={(v) => setRequestType((v || "ALL") as typeof requestType)}
        options={[...requestTypeOptions]}
      />
      {canFilterDepartment && (
        <SelectField
          label="Department"
          value={departmentId ? String(departmentId) : ""}
          onChange={(v) => setDepartmentId(v ? Number(v) : undefined)}
          placeholder="All Departments"
          options={departments.map((d: any) => ({ label: d.name, value: String(d.id) }))}
        />
      )}
    </>
  );

  return (
    <div className="mx-auto w-full max-w-5xl overflow-x-hidden space-y-5 px-3 sm:space-y-6 sm:px-6 md:px-8 pb-20">
      <FilterSheet
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        footer={
          <button
            type="button"
            onClick={() => setFiltersOpen(false)}
            className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black text-white"
          >
            Apply Filters
          </button>
        }
      >
        {sheetFilterControls}
      </FilterSheet>

      {selectedRequest && (
        <AppModal
          isOpen={true}
          onClose={() => setSelectedRequest(null)}
          title={`${TYPE_CONFIG[selectedRequest.type].label} Details`}
          size="2xl"
        >
          <RequestDetailBody request={selectedRequest} />
          <div className="mt-4 px-1 pb-2">
            <button
              onClick={() => setSelectedRequest(null)}
              className="w-full min-h-[56px] rounded-2xl border border-gray-200 bg-white py-3 text-sm font-black text-gray-600 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Close Details
            </button>
          </div>
        </AppModal>
      )}

      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-6 shadow-xl shadow-indigo-200/40 dark:shadow-indigo-900/40 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
              <Inbox className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">Manager Console</p>
              <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">Unified Inbox</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === key ? "bg-white text-indigo-600 shadow dark:bg-gray-800" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className={`grid gap-3 md:items-end ${canFilterDepartment ? "md:grid-cols-[minmax(0,1fr)_220px_220px]" : "md:grid-cols-[minmax(0,1fr)_220px]"}`}>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employee, code, or details..."
            className="h-11 w-full rounded-2xl border border-gray-100 bg-white pl-11 pr-4 text-sm font-semibold text-gray-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          />
        </div>
        <MobileFilterButton
          onClick={() => setFiltersOpen(true)}
          activeCount={(requestType !== "ALL" ? 1 : 0) + (departmentId ? 1 : 0)}
        />
        <div className="hidden md:block">
          <SelectField
            value={requestType}
            onChange={(v) => setRequestType((v || "ALL") as typeof requestType)}
            options={[...requestTypeOptions]}
          />
        </div>
        {canFilterDepartment && (
          <div className="hidden md:block">
            <SelectField
              value={departmentId ? String(departmentId) : ""}
              onChange={(v) => setDepartmentId(v ? Number(v) : undefined)}
              placeholder="All Departments"
              options={departments.map((d: any) => ({ label: d.name, value: String(d.id) }))}
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : visibleRequests.length === 0 ? (
        <InboxZero />
      ) : (
        <div className="space-y-3">
          {visibleRequests.map((req) => (
            <RequestCard key={req.id} req={req} onAction={handleAction} onOpen={setSelectedRequest} isActioning={actioningId === req.id} />
          ))}
          
          {/* ── Pagination Controls ─────────────────────────────── */}
          {data?.totalPages && data.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-gray-700 transition-all hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-sm font-bold text-gray-500">
                Page <span className="text-gray-900 dark:text-white">{page + 1}</span> of {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages - 1}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-gray-700 transition-all hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={revokeModal.isOpen}
        onClose={() => setRevokeModal({ isOpen: false, request: null })}
        onConfirm={confirmRevoke}
        title="Revoke Leave Approval"
        message={`Are you absolutely sure you want to revoke the approved leave for ${revokeModal.request?.employeeName}? This will refund their balance and notify them immediately.`}
        confirmText="Revoke Approval"
        requireConfirmText="REVOKE"
        isDestructive={true}
      />
    </div>
  );
}
