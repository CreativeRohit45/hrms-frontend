import type { TabValue } from "./RequestTypes";

export interface TabOption {
  label: string;
  value: TabValue;
  icon: React.ReactNode;
  count: number;
}

export function SegmentedControl({
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
