import { useState } from "react";
import { AlertCircle, ShieldAlert } from "lucide-react";
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
  requireConfirmText?: string; // e.g. "REVOKE" or "DELETE"
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
  requireConfirmText,
}: ConfirmModalProps) {
  const [inputValue, setInputValue] = useState("");
  const isButtonEnabled = !requireConfirmText || inputValue === requireConfirmText;

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
            disabled={!isButtonEnabled}
            onClick={() => {
              onConfirm();
              onClose();
              setInputValue("");
            }}
            className={`rounded-xl px-5 py-2 text-sm font-bold text-white shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              isDestructive
                ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
            }`}
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${isDestructive ? "bg-red-50 dark:bg-red-950/30 text-red-500" : "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600"}`}>
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-relaxed">
              {title}
            </p>
            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              {message}
            </p>
          </div>
        </div>

        {requireConfirmText && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 dark:border-rose-900/30 dark:bg-rose-950/20">
            <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-widest text-rose-600">
              <ShieldAlert className="h-3.5 w-3.5" />
              Security Check Required
            </div>
            <p className="mb-3 text-[11px] text-gray-500 dark:text-gray-400">
              To proceed, please type <span className="font-black text-rose-600">"{requireConfirmText}"</span> in the box below to confirm this destructive action.
            </p>
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Type "${requireConfirmText}" here`}
              className="w-full rounded-xl border-gray-200 bg-white px-4 py-2 text-sm font-black tracking-widest text-gray-900 placeholder:text-[10px] placeholder:font-bold placeholder:tracking-normal focus:border-rose-500 focus:ring-rose-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            />
          </div>
        )}
      </div>
    </AppModal>
  );
}

