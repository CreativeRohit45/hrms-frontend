import React from "react";
import { Calendar, Clock, Loader2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// Shared form primitives
// py-0 + h-12 keeps every field a uniform 48 px height.
// ─────────────────────────────────────────────────────────────────
export const fieldBase =
  "h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base sm:text-sm font-semibold " +
  "text-gray-900 outline-none transition-all " +
  "focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 " +
  "dark:border-gray-700 dark:bg-gray-800/60 dark:text-white " +
  "dark:focus:border-indigo-500 dark:focus:bg-gray-800";

export function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
      {children}
    </label>
  );
}

/** Textarea — taller, inherits border / bg styles */
export function FormTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
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
export function DateInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
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
export function DateTimeInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
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
export function SubmitButton({
  isPending,
  label,
  pendingLabel,
  color = "indigo",
  disabled,
}: {
  isPending: boolean;
  label: string;
  pendingLabel: string;
  color?: "indigo" | "orange";
  disabled?: boolean;
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
      disabled={isPending || disabled}
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
export function PillToggle<T extends string>({
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
