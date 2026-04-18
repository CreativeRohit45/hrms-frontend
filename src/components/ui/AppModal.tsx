import type { ReactNode } from "react";

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
};

export function AppModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: AppModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center max-md:items-end md:p-4">
      <button
        type="button"
        className="fixed inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div className={`relative w-full ${SIZE_MAP[size]} flex flex-col overflow-hidden bg-white shadow-2xl ring-1 ring-black/5 transition-all dark:bg-gray-900 
        max-md:rounded-t-[2rem] max-md:max-h-[90vh] md:max-h-[85vh] md:rounded-3xl border border-gray-200 dark:border-gray-800 
        animate-in max-md:slide-in-from-bottom-1/2 md:zoom-in-95 duration-300`}>
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center w-full pt-3 pb-1" aria-hidden="true">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="shrink-0 flex items-start justify-between border-b border-gray-100 px-6 py-5 max-md:pt-2 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
            {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.25}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="shrink-0 border-t border-gray-100 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/60">{footer}</div>}
      </div>
    </div>
  );
}
