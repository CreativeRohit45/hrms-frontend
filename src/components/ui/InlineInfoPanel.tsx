import type { ReactNode } from "react";

interface InlineInfoPanelProps {
  tone?: "info" | "warning" | "success";
  title: string;
  message: string;
  icon?: ReactNode;
}

const TONE_CLASSES = {
  info: "border-indigo-200 bg-indigo-50/70 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/25 dark:text-indigo-300",
  warning: "border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-900 dark:bg-amber-950/25 dark:text-amber-300",
  success: "border-emerald-200 bg-emerald-50/70 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/25 dark:text-emerald-300",
};

export function InlineInfoPanel({ tone = "info", title, message, icon }: InlineInfoPanelProps) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${TONE_CLASSES[tone]}`}>
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5">{icon}</div>}
        <div>
          <p className="text-sm font-bold">{title}</p>
          <p className="mt-1 text-xs leading-relaxed opacity-90">{message}</p>
        </div>
      </div>
    </div>
  );
}
