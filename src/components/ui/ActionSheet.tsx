import type { ReactNode } from "react";
import { X } from "lucide-react";

export interface ActionSheetItem {
  label: string;
  description?: string;
  icon?: ReactNode;
  tone?: "default" | "danger";
  disabled?: boolean;
  onClick: () => void;
}

export function ActionSheet({
  isOpen,
  onClose,
  title,
  description,
  items,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  items: ActionSheetItem[];
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] md:hidden">
      <button
        type="button"
        aria-label="Close actions"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-hidden rounded-t-[2rem] border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex justify-center pb-1 pt-3" aria-hidden="true">
          <div className="h-1.5 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div className="min-w-0">
            <h2 className="truncate text-base font-black text-gray-900 dark:text-white">{title}</h2>
            {description && (
              <p className="mt-1 text-xs font-medium leading-relaxed text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-2 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                item.onClick();
                onClose();
              }}
              className={`flex min-h-[56px] w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
                item.tone === "danger"
                  ? "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300"
                  : "border-gray-100 bg-gray-50 text-gray-800 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-100"
              }`}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <span className="min-w-0">
                <span className="block text-sm font-black">{item.label}</span>
                {item.description && (
                  <span className="mt-0.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                    {item.description}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
