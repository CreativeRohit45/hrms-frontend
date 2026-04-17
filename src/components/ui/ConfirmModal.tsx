import { AlertCircle } from "lucide-react";
import { AppModal } from "./AppModal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = true,
}: ConfirmModalProps) {
  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`rounded-xl px-5 py-2 text-sm font-bold text-white shadow-sm transition-all active:scale-95 ${
              isDestructive
                ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
            }`}
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${isDestructive ? "bg-red-50 dark:bg-red-950/30" : "bg-indigo-50 dark:bg-indigo-950/30"}`}>
          <AlertCircle className={`h-6 w-6 ${isDestructive ? "text-red-500" : "text-indigo-600"}`} />
        </div>
        <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{message}</p>
      </div>
    </AppModal>
  );
}
