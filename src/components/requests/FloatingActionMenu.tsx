import { useState } from "react";
import { Plus, Palmtree, Ticket } from "lucide-react";

export function FloatingActionMenu({
  onLeave,
  onGatepass,
  isActive,
}: {
  onLeave: () => void;
  onGatepass: () => void;
  isActive: boolean;
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
            disabled={!isActive}
            title={!isActive ? "You must be punched in to request a gatepass" : ""}
            className={`flex min-h-[52px] items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-gray-800 shadow-xl ring-1 ring-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white dark:ring-gray-700`}
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
