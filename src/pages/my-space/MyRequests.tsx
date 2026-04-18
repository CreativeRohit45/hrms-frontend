import { useState } from "react";
import {
  Plus,
  Palmtree,
  Ticket,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Loader2,
  Sparkles,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  ArrowRight,
  SunDim,
  Sunset,
  Info,
} from "lucide-react";
import { useAppToast } from "../../components/ui/ToastProvider";
import api from "../../api/axios";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { AppModal } from "../../components/ui/AppModal";

// ── TanStack Query hooks (parallel fetching) ──────────────────────
import { useMyLeaves, useLeaveTypes, useApplyLeave } from "../../hooks/queries/useLeaves";
import { useMyGatepasses, useApplyGatepass } from "../../hooks/queries/useGatepasses";

interface Request {
  id: number;
  type: "LEAVE" | "GATEPASS";
  details: string;
  status: string;
  timestamp: string;
  metadata?: any;
}

type TabValue = "ALL" | "LEAVE" | "GATEPASS";

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function getStatusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "danger";
  if (status === "CANCELLED") return "neutral";
  return "warning";
}

function fmt(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString(undefined, opts ?? { month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─────────────────────────────────────────────────────────────────
// Shared form primitives
// py-0 + h-12 keeps every field a uniform 48 px height.
// ─────────────────────────────────────────────────────────────────
const fieldBase =
  "h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base sm:text-sm font-semibold " +
  "text-gray-900 outline-none transition-all " +
  "focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 " +
  "dark:border-gray-700 dark:bg-gray-800/60 dark:text-white " +
  "dark:focus:border-indigo-500 dark:focus:bg-gray-800";

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
      {children}
    </label>
  );
}

/** Generic text/number input */
function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={fieldBase} />;
}

/** Textarea — taller, inherits border / bg styles */
function FormTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={
        "w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base sm:text-sm font-medium " +
        "text-gray-900 outline-none resize-none transition-all leading-relaxed " +
        "focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 " +
        "dark:border-gray-700 dark:bg-gray-800/60 dark:text-white " +
        "dark:focus:border-indigo-500 dark:focus:bg-gray-800"
      }
    />
  );
}

/**
 * DateInput — wraps <input type="date"> in a relative container.
 * Strips default browser chrome with appearance-none / bg-transparent,
 * then overlays a Calendar icon on the left so it looks like a
 * custom premium picker on every platform.
 */
function DateInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative flex items-center">
      <Calendar className="pointer-events-none absolute left-3.5 h-4 w-4 text-indigo-400 dark:text-indigo-300" />
      <input
        type="date"
        {...props}
        className={
          `${fieldBase} min-w-0 appearance-none bg-transparent pl-10 ` +
          "dark:[color-scheme:dark]"
        }
      />
    </div>
  );
}

/**
 * DateTimeInput — same treatment for datetime-local pickers.
 * Clock icon on the left, full width, uniform 48 px height.
 */
function DateTimeInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative flex items-center">
      <Clock className="pointer-events-none absolute left-3.5 h-4 w-4 text-indigo-400 dark:text-indigo-300" />
      <input
        type="datetime-local"
        {...props}
        className={
          `${fieldBase} min-w-0 appearance-none bg-transparent pl-10 ` +
          "dark:[color-scheme:dark]"
        }
      />
    </div>
  );
}

/** Full-width submit button with built-in loading spinner */
function SubmitButton({
  isPending,
  label,
  pendingLabel,
  color = "indigo",
}: {
  isPending: boolean;
  label: string;
  pendingLabel: string;
  color?: "indigo" | "orange";
}) {
  const colorMap = {
    indigo:
      "bg-indigo-600 shadow-indigo-600/25 hover:bg-indigo-700 focus:ring-indigo-500/30 active:bg-indigo-800",
    orange:
      "bg-orange-500 shadow-orange-500/25 hover:bg-orange-600 focus:ring-orange-500/30 active:bg-orange-700",
  };
  return (
    <button
      type="submit"
      disabled={isPending}
      className={`relative w-full min-h-[52px] rounded-2xl px-6 py-3.5 text-base font-black text-white shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${colorMap[color]}`}
    >
      <span className={`flex items-center justify-center gap-2 ${isPending ? "opacity-0" : "opacity-100"}`}>
        {label}
      </span>
      {isPending && (
        <span className="absolute inset-0 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          {pendingLabel}
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// Mini segmented pill — used for two-option toggles inside forms.
// Purely flexbox; zero calc() math.
// ─────────────────────────────────────────────────────────────────
function PillToggle<T extends string>({
  value,
  onChange,
  options,
  activeColor = "indigo",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { label: string; value: T; icon?: React.ReactNode }[];
  activeColor?: "indigo" | "orange";
}) {
  const activeMap = {
    indigo: "bg-indigo-600 text-white shadow-md shadow-indigo-500/20",
    orange: "bg-orange-500 text-white shadow-md shadow-orange-500/20",
  };
  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar rounded-2xl bg-gray-100 p-1 dark:bg-gray-800">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-1 min-w-max min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${active
              ? activeMap[activeColor]
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
          >
            {opt.icon && <span>{opt.icon}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Activity-feed segmented control (3-way, with count badge)
// ─────────────────────────────────────────────────────────────────
interface TabOption {
  label: string;
  value: TabValue;
  icon: React.ReactNode;
  count: number;
}

function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: TabValue;
  onChange: (v: TabValue) => void;
  options: TabOption[];
}) {
  return (
    <div className="flex w-full gap-1 overflow-x-auto no-scrollbar rounded-2xl bg-gray-100 p-1 dark:bg-gray-800">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              "flex flex-1 min-w-max min-h-[44px] items-center justify-center gap-1.5",
              "rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200",
              active
                ? "bg-white text-gray-900 shadow-md dark:bg-gray-700 dark:text-white"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
            ].join(" ")}
          >
            <span className={active ? "text-indigo-600 dark:text-indigo-400" : ""}>{opt.icon}</span>
            <span className="hidden min-[380px]:inline">{opt.label}</span>
            <span
              className={[
                "inline-flex h-4 min-w-[1rem] items-center justify-center",
                "rounded-full px-1.5 text-[10px] font-black leading-none",
                active
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                  : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
              ].join(" ")}
            >
              {opt.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Request Card — mobile-first vertical layout
// Gains onClick + cursor-pointer for the details modal flow.
// ─────────────────────────────────────────────────────────────────
function RequestCard({
  req,
  onClick,
}: {
  req: Request;
  onClick: (r: Request) => void;
}) {
  const isLeave = req.type === "LEAVE";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(req)}
      onKeyDown={(e) => e.key === "Enter" && onClick(req)}
      className="group cursor-pointer rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:border-indigo-100 hover:bg-gray-50 hover:shadow-lg hover:shadow-indigo-500/5 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 dark:border-gray-800/60 dark:bg-gray-900 dark:hover:bg-gray-800/50"
    >
      {/* ── Mobile layout ─────────────────────────────────────── */}
      <div className="p-4 md:hidden">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${isLeave
              ? "bg-blue-50 text-blue-500 dark:bg-blue-950/40"
              : "bg-orange-50 text-orange-500 dark:bg-orange-950/40"
              }`}
          >
            {isLeave ? <Palmtree className="h-5 w-5" /> : <Ticket className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${isLeave ? "text-blue-500" : "text-orange-500"
                  }`}
              >
                {req.type}
              </span>
              <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="text-[10px] font-semibold text-gray-400">
                {fmt(req.timestamp)}
              </span>
            </div>
            <p className="mt-1 text-sm font-bold leading-snug text-gray-900 dark:text-white">
              {req.details}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <StatusBadge label={req.status} tone={getStatusTone(req.status)} />
          <ChevronRight className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-400" />
        </div>
      </div>

      {/* ── Desktop layout (md+) ──────────────────────────────── */}
      <div className="hidden md:flex md:items-center md:gap-4 md:p-5">
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 ${isLeave
            ? "bg-blue-50 text-blue-500 dark:bg-blue-950/40"
            : "bg-orange-50 text-orange-500 dark:bg-orange-950/40"
            }`}
        >
          {isLeave ? <Palmtree className="h-5 w-5" /> : <Ticket className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${isLeave ? "text-blue-500" : "text-orange-500"
                }`}
            >
              {req.type}
            </span>
            <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span className="text-[10px] font-semibold text-gray-400">{fmt(req.timestamp)}</span>
          </div>
          <p className="mt-0.5 truncate text-sm font-bold text-gray-900 dark:text-white">
            {req.details}
          </p>
        </div>
        <StatusBadge label={req.status} tone={getStatusTone(req.status)} />
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-indigo-400" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Skeleton card
// ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4 dark:border-gray-800/60 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 flex-shrink-0 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        <div className="flex-1 space-y-2">
          <div className="h-2.5 w-20 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
          <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Request Details Modal
//
// Renders a rich read-only view of any selected request.
// Layout: large status hero → meta grid → details card.
// ─────────────────────────────────────────────────────────────────
const statusConfig: Record<
  string,
  { icon: React.ReactNode; bg: string; text: string; border: string; label: string }
> = {
  APPROVED: {
    icon: <CheckCircle2 className="h-6 w-6" />,
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800/60",
    label: "Approved",
  },
  PENDING: {
    icon: <AlertTriangle className="h-6 w-6" />,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800/60",
    label: "Pending Review",
  },
  REJECTED: {
    icon: <XCircle className="h-6 w-6" />,
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800/60",
    label: "Rejected",
  },
  CANCELLED: {
    icon: <Ban className="h-6 w-6" />,
    bg: "bg-gray-50 dark:bg-gray-800/40",
    text: "text-gray-500 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-700/60",
    label: "Cancelled",
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

function RequestDetailsModal({
  request,
  onClose,
}: {
  request: Request;
  onClose: () => void;
}) {
  const isLeave = request.type === "LEAVE";
  const cfg = statusConfig[request.status] ?? statusConfig["PENDING"];
  const m = request.metadata ?? {};

  return (
    <AppModal
      isOpen={true}
      onClose={onClose}
      title={isLeave ? "Leave Details" : "Gatepass Details"}
      size="lg"
    >
      <div className="space-y-5 pb-4 pt-2">

        {/* ── Status hero ─────────────────────────────────────── */}
        <div
          className={`flex items-center gap-4 rounded-2xl border p-4 ${cfg.bg} ${cfg.border}`}
        >
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${cfg.bg} ${cfg.text}`}>
            {cfg.icon}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Current Status
            </p>
            <p className={`text-xl font-black ${cfg.text}`}>{cfg.label}</p>
          </div>
        </div>

        {/* ── Type banner ─────────────────────────────────────── */}
        <div
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${isLeave
            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
            : "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300"
            }`}
        >
          {isLeave ? <Palmtree className="h-5 w-5 flex-shrink-0" /> : <Ticket className="h-5 w-5 flex-shrink-0" />}
          <span className="text-sm font-black uppercase tracking-wider">
            {isLeave ? "Leave Request" : "Gatepass Request"}
          </span>
        </div>

        {/* ── Meta grid ───────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800/60 dark:bg-gray-800/30">
          {isLeave ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailRow label="Leave Type" value={m.leaveTypeName ?? "—"} />
              <DetailRow
                label="Applied On"
                value={fmt(request.timestamp, { day: "numeric", month: "long", year: "numeric" })}
              />
              <DetailRow
                label="Start Date"
                value={
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                    {m.startDate ?? "—"}
                  </span>
                }
              />
              <DetailRow
                label="End Date"
                value={
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                    {m.endDate ?? "—"}
                  </span>
                }
              />
              {m.halfDay && (
                <DetailRow
                  label="Half Day"
                  value={
                    <span className="flex items-center gap-1.5">
                      {m.halfType === "FIRST" ? (
                        <SunDim className="h-3.5 w-3.5 text-amber-400" />
                      ) : (
                        <Sunset className="h-3.5 w-3.5 text-orange-400" />
                      )}
                      {m.halfType === "FIRST" ? "First Half" : "Second Half"}
                    </span>
                  }
                />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailRow label="Pass Type" value={m.gatepassType ?? "—"} />
              <DetailRow
                label="Applied On"
                value={fmt(request.timestamp, { day: "numeric", month: "long", year: "numeric" })}
              />
              <DetailRow
                label="Exit Time"
                value={
                  m.requestedOutTime ? (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-indigo-400" />
                      {fmtTime(m.requestedOutTime)}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
              <DetailRow
                label="Return Time"
                value={
                  m.requestedInTime ? (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-indigo-400" />
                      {fmtTime(m.requestedInTime)}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
          )}
        </div>

        {/* ── Reason / details ────────────────────────────────── */}
        {(m.reason || request.details) && (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800/60 dark:bg-gray-800/30">
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Reason / Details
            </p>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {m.reason || request.details}
            </p>
          </div>
        )}

        {/* ── Close CTA ────────────────────────────────────────── */}
        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[48px] rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-500 transition-all hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Close
        </button>
      </div>
    </AppModal>
  );
}

// ─────────────────────────────────────────────────────────────────
// Floating Action Menu (FAB)
// ─────────────────────────────────────────────────────────────────
function FloatingActionMenu({
  onLeave,
  onGatepass,
}: {
  onLeave: () => void;
  onGatepass: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

      <div className="fixed bottom-6 right-5 z-50 flex flex-col items-end gap-3">
        <div
          className={`flex flex-col items-end gap-2 transition-all duration-200 ${open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
            }`}
        >
          <button
            type="button"
            onClick={() => { setOpen(false); onLeave(); }}
            className="flex min-h-[52px] items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-gray-800 shadow-xl ring-1 ring-gray-200 transition-all active:scale-95 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
              <Palmtree className="h-4 w-4" />
            </span>
            Apply for Leave
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onGatepass(); }}
            className="flex min-h-[52px] items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-gray-800 shadow-xl ring-1 ring-gray-200 transition-all active:scale-95 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <Ticket className="h-4 w-4" />
            </span>
            Request Gatepass
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close actions" : "New request"}
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40 transition-all duration-300 hover:bg-indigo-700 active:scale-95 ${open ? "rotate-45" : "rotate-0"
            }`}
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────
export default function MyRequests() {
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showGatepassModal, setShowGatepassModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("ALL");
  const { pushToast } = useAppToast();

  // ── Parallel data fetching — no waterfall ──────────────────────
  const { data: leavesRaw = [], isLoading: leavesLoading } = useMyLeaves();
  const { data: gatepassesRaw = [], isLoading: gatepassesLoading } = useMyGatepasses();

  const loading = leavesLoading || gatepassesLoading;

  // ── Normalize into unified request list ────────────────────────
  const requests: Request[] = [
    ...leavesRaw.map((l: any) => ({
      id: l.id,
      type: "LEAVE" as const,
      details: `${l.leaveTypeName}: ${l.startDate} to ${l.endDate}`,
      status: l.status,
      timestamp: l.createdAt || new Date().toISOString(),
      metadata: l,
    })),
    ...gatepassesRaw.map((g: any) => ({
      id: g.id,
      type: "GATEPASS" as const,
      details: `${g.gatepassType}: ${new Date(g.requestedOutTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })} transit`,
      status: g.status,
      timestamp: g.createdAt || new Date().toISOString(),
      metadata: g,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const leaves = requests.filter((r) => r.type === "LEAVE");
  const gatepasses = requests.filter((r) => r.type === "GATEPASS");

  const visibleRequests =
    activeTab === "ALL" ? requests : activeTab === "LEAVE" ? leaves : gatepasses;

  const handleOpenLeave = () => {
    pushToast({ title: "Opening Form", message: "Syncing Leave Application Drawer...", tone: "info" });
    setShowLeaveModal(true);
  };

  const handleOpenGatepass = () => {
    pushToast({ title: "Opening Form", message: "Syncing Gatepass Request Drawer...", tone: "info" });
    setShowGatepassModal(true);
  };

  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden space-y-6 px-4 sm:px-6 md:px-8 pb-28 pt-4">

      {/* ── MODAL PORTAL ──────────────────────────────────────────── */}
      <div className="relative z-[1000]">
        {showLeaveModal && (
          <LeaveApplyModal
            onClose={() => setShowLeaveModal(false)}
            onSuccess={() => setShowLeaveModal(false)}
          />
        )}
        {showGatepassModal && (
          <GatepassApplyModal
            onClose={() => setShowGatepassModal(false)}
            onSuccess={() => setShowGatepassModal(false)}
          />
        )}
        {selectedRequest && (
          <RequestDetailsModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
          />
        )}
      </div>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-indigo-600 px-5 py-7 text-white shadow-xl shadow-indigo-600/20 sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-indigo-400/30 blur-2xl" />

        <div className="relative space-y-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200/80">
              Requests Hub
            </p>
            <h1 className="mt-1 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
              My Requests
            </h1>
            <p className="mt-1.5 max-w-sm text-sm text-indigo-100/70">
              Track leaves &amp; gatepasses. Tap any card to view details.
            </p>
          </div>

          {/* Stats row */}
          <div className="flex gap-3">
            {[
              { label: "Approved", value: requests.filter((r) => r.status === "APPROVED").length },
              { label: "Pending", value: requests.filter((r) => r.status === "PENDING").length },
              { label: "Total", value: requests.length },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex-1 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-center backdrop-blur-sm sm:px-4"
              >
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200/70">
                  {stat.label}
                </p>
                <p className="mt-0.5 text-2xl font-black">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* CTA buttons — stacked on mobile, row on sm+ */}
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={handleOpenLeave}
              className="group flex flex-1 min-h-[48px] items-center justify-center gap-2.5 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/25 active:scale-[0.97]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition-transform duration-200 group-hover:rotate-90">
                <Plus className="h-4 w-4" />
              </span>
              Apply for Leave
            </button>
            <button
              type="button"
              onClick={handleOpenGatepass}
              className="group flex flex-1 min-h-[48px] items-center justify-center gap-2.5 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/25 active:scale-[0.97]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition-transform duration-200 group-hover:rotate-90">
                <Plus className="h-4 w-4" />
              </span>
              Request Gatepass
            </button>
          </div>
        </div>
      </div>

      {/* ── ACTIVITY FEED ─────────────────────────────────────────── */}
      <div className="rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-800/60 dark:bg-gray-900">
        <div className="flex items-center gap-2 px-4 pt-5 pb-4 sm:px-6">
          <FileText className="h-4 w-4 text-indigo-500" />
          <h2 className="text-base font-black text-gray-900 dark:text-white">Activity</h2>
        </div>

        <div className="px-4 pb-1 sm:px-6">
          <SegmentedControl
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { label: "All", value: "ALL", icon: <Sparkles className="h-3.5 w-3.5" />, count: requests.length },
              { label: "Leaves", value: "LEAVE", icon: <Palmtree className="h-3.5 w-3.5" />, count: leaves.length },
              { label: "Gatepasses", value: "GATEPASS", icon: <Ticket className="h-3.5 w-3.5" />, count: gatepasses.length },
            ]}
          />
        </div>

        <div className="space-y-3 px-4 py-4 sm:px-6 sm:pb-6">
          {loading ? (
            <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
          ) : visibleRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 py-14 dark:border-gray-700/60">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800">
                <AlertCircle className="h-7 w-7 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="mt-4 text-sm font-bold text-gray-400">No requests found</p>
              <p className="mt-1 text-xs text-gray-300 dark:text-gray-600">
                Tap + to create your first one.
              </p>
            </div>
          ) : (
            visibleRequests.map((req) => (
              <RequestCard
                key={`${req.type}-${req.id}`}
                req={req}
                onClick={setSelectedRequest}
              />
            ))
          )}
        </div>
      </div>

      {/* ── FAB ───────────────────────────────────────────────────── */}
      <FloatingActionMenu onLeave={handleOpenLeave} onGatepass={handleOpenGatepass} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// LEAVE MODAL  — V3
// · Half-day toggle expands into First/Second half pill selector
// · Date inputs use DateInput (icon-wrapped, appearance-none)
// · Select height fixed to h-12 via fieldBase
// ─────────────────────────────────────────────────────────────────
function LeaveApplyModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: types = [] } = useLeaveTypes();
  const [form, setForm] = useState<{
    leaveTypeId: number;
    startDate: string;
    endDate: string;
    reason: string;
    halfDay: boolean;
    halfType: "FIRST" | "SECOND";
  }>({ leaveTypeId: 0, startDate: "", endDate: "", reason: "", halfDay: false, halfType: "FIRST" });
  const { pushToast } = useAppToast();
  const applyMutation = useApplyLeave();

  // Auto-select first leave type when types load
  if (form.leaveTypeId === 0 && types.length > 0) {
    setForm((f) => ({ ...f, leaveTypeId: types[0].id }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await applyMutation.mutateAsync(form);
      pushToast({ title: "Success", message: "Leave applied successfully!", tone: "success" });
      onSuccess();
    } catch (err: any) {
      pushToast({ title: "Error", message: err.response?.data?.message || "Failed to apply", tone: "error" });
    }
  };

  return (
    <AppModal isOpen={true} onClose={onClose} title="Apply for Leave" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5 pb-4 pt-2">

        {/* Leave type — h-12 via fieldBase keeps it same height as inputs */}
        <div>
          <FormLabel>Leave Type</FormLabel>
          <div className="relative">
            <select
              value={form.leaveTypeId}
              onChange={(e) => setForm({ ...form, leaveTypeId: Number(e.target.value) })}
              className={`${fieldBase} appearance-none pr-10`}
            >
              {types.map((t: any) => (
                <option key={t.id} value={t.id} className="dark:bg-gray-900">
                  {t.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Date range — stacked on mobile, side-by-side sm+ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FormLabel>Start Date</FormLabel>
            <DateInput
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
          <div>
            <FormLabel>End Date</FormLabel>
            <DateInput
              required
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
        </div>

        {/* Half day toggle row */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60">
          <div className="flex min-h-[52px] items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Half Day</p>
              <p className="text-xs text-gray-400">Single-day leaves only</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, halfDay: !form.halfDay })}
              aria-checked={form.halfDay}
              role="switch"
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${form.halfDay ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-600"
                }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ${form.halfDay ? "translate-x-5" : "translate-x-0"
                  }`}
              />
            </button>
          </div>

          {/* Expanded half-type picker — slides in when halfDay is true */}
          {form.halfDay && (
            <div className="border-t border-gray-200 px-4 pb-4 pt-3 dark:border-gray-700">
              <p className="mb-2.5 text-xs font-bold text-gray-500 dark:text-gray-400">
                Which half?
              </p>
              <PillToggle<"FIRST" | "SECOND">
                value={form.halfType}
                onChange={(v) => setForm({ ...form, halfType: v })}
                activeColor="indigo"
                options={[
                  {
                    label: "First Half",
                    value: "FIRST",
                    icon: <SunDim className="h-4 w-4" />,
                  },
                  {
                    label: "Second Half",
                    value: "SECOND",
                    icon: <Sunset className="h-4 w-4" />,
                  },
                ]}
              />
            </div>
          )}
        </div>

        {/* Reason */}
        <div>
          <FormLabel>Reason</FormLabel>
          <FormTextarea
            required
            rows={3}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Brief details about your leave..."
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-1">
          <SubmitButton
            isPending={applyMutation.isPending}
            label="Apply for Leave"
            pendingLabel="Submitting…"
            color="indigo"
          />
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[48px] rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-500 transition-all hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Discard
          </button>
        </div>
      </form>
    </AppModal>
  );
}

// ─────────────────────────────────────────────────────────────────
// GATEPASS MODAL  — V3
// · Datetime pickers use DateTimeInput (icon-wrapped, appearance-none)
// · Pass-type toggle uses PillToggle (orange active)
// ─────────────────────────────────────────────────────────────────
function GatepassApplyModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    requestedOutTime: "",
    requestedInTime: "",
    gatepassType: "OFFICIAL" as "OFFICIAL" | "PERSONAL",
    reason: "",
  });
  const { pushToast } = useAppToast();
  const applyMutation = useApplyGatepass();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await applyMutation.mutateAsync(form as any);
      pushToast({ title: "Success", message: "Gatepass request sent!", tone: "success" });
      onSuccess();
    } catch (err: any) {
      pushToast({ title: "Error", message: err.response?.data?.message || "Failed to submit", tone: "error" });
    }
  };

  return (
    <AppModal isOpen={true} onClose={onClose} title="Request Gatepass" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5 pb-4 pt-2">

        {/* Pass type */}
        <div>
          <FormLabel>Pass Type</FormLabel>
          <PillToggle<"OFFICIAL" | "PERSONAL">
            value={form.gatepassType}
            onChange={(v) => setForm({ ...form, gatepassType: v })}
            activeColor="orange"
            options={[
              { label: "Official", value: "OFFICIAL", icon: <span>🏢</span> },
              { label: "Personal", value: "PERSONAL", icon: <span>🙋</span> },
            ]}
          />
        </div>

        {/* Time pickers — stacked on mobile, side-by-side sm+ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FormLabel>Exit Time</FormLabel>
            <DateTimeInput
              required
              value={form.requestedOutTime}
              onChange={(e) => setForm({ ...form, requestedOutTime: e.target.value })}
            />
          </div>
          <div>
            <FormLabel>Return Time</FormLabel>
            <DateTimeInput
              required
              value={form.requestedInTime}
              onChange={(e) => setForm({ ...form, requestedInTime: e.target.value })}
            />
          </div>
        </div>

        {/* Reason */}
        <div>
          <FormLabel>Reason</FormLabel>
          <FormTextarea
            required
            rows={3}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Details about your transit…"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-1">
          <SubmitButton
            isPending={applyMutation.isPending}
            label="Submit Gatepass Request"
            pendingLabel="Sending…"
            color="orange"
          />
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[48px] rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-500 transition-all hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Discard
          </button>
        </div>
      </form>
    </AppModal>
  );
}