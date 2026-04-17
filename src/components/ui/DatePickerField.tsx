import { useMemo, useRef, useState } from "react";

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function buildCalendar(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const grid: string[] = [];
  for (let i = 0; i < firstDay; i += 1) grid.push("");
  for (let day = 1; day <= daysInMonth; day += 1) {
    grid.push(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  return grid;
}

function getMonthFromValue(value: string) {
  if (value) return value.substring(0, 7);
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

interface DatePickerFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}

export function DatePickerField({ label, value, onChange }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(getMonthFromValue(value));
  const containerRef = useRef<HTMLDivElement>(null);

  const pickerDays = useMemo(() => buildCalendar(open ? pickerMonth : getMonthFromValue(value)), [open, pickerMonth, value]);
  const formattedValue = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "Select date";

  return (
    <div className="relative w-full space-y-1.5 text-left" ref={containerRef}>
      {label && <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</label>}
      <button
        type="button"
        onClick={() => {
          setPickerMonth(getMonthFromValue(value));
          setOpen((current) => !current);
        }}
        className="flex w-full items-center justify-between gap-2.5 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition-all hover:border-gray-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:border-gray-700"
      >
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
          </svg>
          {formattedValue}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[70] mt-2 w-[280px] rounded-3xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const [year, month] = pickerMonth.split("-").map(Number);
                const previous = new Date(year, month - 2, 1);
                setPickerMonth(`${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`);
              }}
              className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="m15 19-7-7 7-7" /></svg>
            </button>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
              {new Date(`${pickerMonth}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </p>
            <button
              type="button"
              onClick={() => {
                const [year, month] = pickerMonth.split("-").map(Number);
                const next = new Date(year, month, 1);
                setPickerMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
              }}
              className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="m9 5 7 7-7 7" /></svg>
            </button>
          </div>
          <div className="mb-2 grid grid-cols-7">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="py-1 text-center text-[10px] font-bold uppercase tracking-tight text-gray-400">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {pickerDays.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} />;
              const isSelected = day === value;
              const isToday = day === new Date().toISOString().split("T")[0];
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    onChange(day);
                    setOpen(false);
                  }}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? "scale-110 bg-indigo-600 text-white shadow-lg shadow-indigo-300/40 dark:shadow-indigo-900/40"
                      : isToday
                        ? "font-bold text-indigo-600 ring-2 ring-inset ring-indigo-500/30 dark:text-indigo-400"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  {day.split("-")[2]}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
