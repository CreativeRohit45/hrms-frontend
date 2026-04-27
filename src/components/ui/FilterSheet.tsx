import type { ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { AppModal } from "./AppModal";

export function MobileFilterButton({
  onClick,
  activeCount = 0,
}: {
  onClick: () => void;
  activeCount?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 md:hidden"
    >
      <SlidersHorizontal className="h-4 w-4" />
      Filters
      {activeCount > 0 && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] text-white">
          {activeCount}
        </span>
      )}
    </button>
  );
}

export function FilterSheet({
  isOpen,
  onClose,
  title = "Filters",
  children,
  footer,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <AppModal isOpen={isOpen} onClose={onClose} title={title} size="md" footer={footer}>
      <div className="space-y-4">{children}</div>
    </AppModal>
  );
}
