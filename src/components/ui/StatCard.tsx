import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  tone?: "info" | "success" | "warning" | "danger" | "neutral";
}

const TONE_STYLES = {
  info: {
    icon: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300",
  },
  success: {
    icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300",
  },
  warning: {
    icon: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300",
  },
  danger: {
    icon: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300",
  },
  neutral: {
    icon: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone = "info",
}: StatCardProps) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">
            {title}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${TONE_STYLES[tone].icon}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
