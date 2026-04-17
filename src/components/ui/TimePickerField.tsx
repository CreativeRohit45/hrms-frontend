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

interface TimePickerFieldProps {
  label?: string;
  parts: TimeParts;
  setter: (value: TimeParts) => void;
}

export function TimePickerField({ label, parts, setter }: TimePickerFieldProps) {
  return (
    <div className="w-full space-y-1.5">
      {label && <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</label>}
      <div className="flex w-full gap-2">
        <div className="relative flex-1">
          <select
            value={parts.h}
            onChange={(e) => setter({ ...parts, h: e.target.value })}
            className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            {Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0")).map((hour) => (
              <option key={hour} value={hour}>{hour}</option>
            ))}
          </select>
        </div>
        <div className="relative flex-1">
          <select
            value={parts.m}
            onChange={(e) => setter({ ...parts, m: e.target.value })}
            className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            {Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0")).map((minute) => (
              <option key={minute} value={minute}>{minute}</option>
            ))}
          </select>
        </div>
        <div className="flex rounded-2xl border border-gray-100 bg-gray-100 p-1 dark:border-gray-800 dark:bg-gray-800">
          {(["AM", "PM"] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setter({ ...parts, p: period })}
              className={`rounded-xl px-3 text-[11px] font-bold transition-all ${parts.p === period ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
