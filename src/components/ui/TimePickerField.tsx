export interface TimeParts {
  h: string;
  m: string;
  p: "AM" | "PM";
}

export function parseTimeToParts(timeString: string | null | undefined): TimeParts {
  if (!timeString) return { h: "09", m: "00", p: "AM" };

  if (timeString.includes("T")) {
    const date = new Date(timeString);
    const hours = date.getHours();
    return {
      h: String(hours % 12 || 12).padStart(2, "0"),
      m: String(date.getMinutes()).padStart(2, "0"),
      p: hours >= 12 ? "PM" : "AM",
    };
  }

  const [hourString = "09", minuteString = "00"] = timeString.split(":");
  const hours = Number(hourString);
  return {
    h: String(hours % 12 || 12).padStart(2, "0"),
    m: minuteString.padStart(2, "0"),
    p: hours >= 12 ? "PM" : "AM",
  };
}

export function to24hString(parts: TimeParts) {
  let hour24 = Number(parts.h);
  if (parts.p === "PM" && hour24 < 12) hour24 += 12;
  if (parts.p === "AM" && hour24 === 12) hour24 = 0;
  return `${String(hour24).padStart(2, "0")}:${parts.m.padStart(2, "0")}:00`;
}

const HOURS = Array.from({ length: 12 }, (_, i) => ({
  label: String(i + 1).padStart(2, "0"),
  value: String(i + 1).padStart(2, "0"),
}));

const MINUTES = Array.from({ length: 60 }, (_, i) => ({
  label: String(i).padStart(2, "0"),
  value: String(i).padStart(2, "0"),
}));

interface TimePickerFieldProps {
  label?: string;
  parts: TimeParts;
  setter: (value: TimeParts) => void;
}

export function TimePickerField({ label, parts, setter }: TimePickerFieldProps) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
          {label}
        </label>
      )}
      <div className="flex w-full items-center gap-2">
        {/* Hour */}
        <div className="relative flex-1">
          <select
            value={parts.h}
            onChange={(e) => setter({ ...parts, h: e.target.value })}
            className="h-12 w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 pr-8 text-sm font-semibold text-gray-800 outline-none transition-all hover:border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200"
          >
            {HOURS.map((h) => (
              <option key={h.value} value={h.value} className="dark:bg-gray-900">
                {h.label}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
          </svg>
        </div>

        <span className="text-lg font-black text-gray-300 dark:text-gray-600">:</span>

        {/* Minute */}
        <div className="relative flex-1">
          <select
            value={parts.m}
            onChange={(e) => setter({ ...parts, m: e.target.value })}
            className="h-12 w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 pr-8 text-sm font-semibold text-gray-800 outline-none transition-all hover:border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200"
          >
            {MINUTES.map((m) => (
              <option key={m.value} value={m.value} className="dark:bg-gray-900">
                {m.label}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
          </svg>
        </div>

        {/* AM/PM toggle */}
        <div className="flex h-12 items-center rounded-2xl border border-gray-100 bg-gray-100 p-1 dark:border-gray-800 dark:bg-gray-800">
          {(["AM", "PM"] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setter({ ...parts, p: period })}
              className={`flex h-10 items-center justify-center rounded-xl px-3.5 text-[11px] font-bold transition-all ${
                parts.p === period
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
