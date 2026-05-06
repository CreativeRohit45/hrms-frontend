import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

function toLocalDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface DatePickerFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  align?: "left" | "right";
}

export function DatePickerField({ label, value, onChange, required, align = "left" }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(getMonthFromValue(value));
  const [yearMonthPicker, setYearMonthPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click-outside to close
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setYearMonthPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const pickerDays = useMemo(
    () => buildCalendar(open ? pickerMonth : getMonthFromValue(value)),
    [open, pickerMonth, value]
  );

  const formattedValue = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Select date";

  const [currentYear, currentMonth] = pickerMonth.split("-").map(Number);

  const shiftMonth = (delta: number) => {
    const d = new Date(currentYear, currentMonth - 1 + delta, 1);
    setPickerMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const shiftYear = (delta: number) => {
    setPickerMonth(`${currentYear + delta}-${String(currentMonth).padStart(2, "0")}`);
  };

  const selectMonthYear = (month: number) => {
    setPickerMonth(`${currentYear}-${String(month).padStart(2, "0")}`);
    setYearMonthPicker(false);
  };

  const todayStr = toLocalDateString(new Date());

  return (
    <div className="relative w-full space-y-1.5 text-left" ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
          {label}
        </label>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={value ? `Selected date: ${formattedValue}. Press Enter to change.` : "Select a date"}
        onClick={() => {
          setPickerMonth(getMonthFromValue(value));
          setYearMonthPicker(false);
          setOpen((c) => !c);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape" && open) {
            e.preventDefault();
            setOpen(false);
          }
        }}
        className="flex h-12 w-full items-center justify-between gap-2.5 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm transition-all hover:border-gray-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:border-gray-700"
      >
        <span className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-gray-400" />
          {formattedValue}
        </span>
      </button>

      {/* Hidden native input for form validation when required */}
      {required && (
        <input
          type="text"
          value={value}
          required
          tabIndex={-1}
          className="absolute h-0 w-0 opacity-0"
          onChange={() => {}}
        />
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Date picker calendar"
          aria-modal="true"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setOpen(false);
              containerRef.current?.querySelector("button")?.focus();
            }
          }}
          className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full z-[70] mt-2 w-[300px] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 animate-in fade-in slide-in-from-top-2 duration-200`}>
          {/* ── Header with year arrows + clickable month/year ── */}
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-3 dark:border-gray-800">
            <button
              type="button"
              onClick={() => (yearMonthPicker ? shiftYear(-1) : shiftMonth(-1))}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setYearMonthPicker(!yearMonthPicker)}
              className="rounded-xl px-3 py-1.5 text-sm font-bold text-gray-800 transition-all hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-200 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
            >
              {yearMonthPicker
                ? currentYear
                : `${MONTH_NAMES[currentMonth - 1]} ${currentYear}`}
            </button>

            <button
              type="button"
              onClick={() => (yearMonthPicker ? shiftYear(1) : shiftMonth(1))}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {yearMonthPicker ? (
            /* ── Month Grid ── */
            <div className="grid grid-cols-3 gap-2 p-4">
              {MONTH_NAMES.map((name, idx) => {
                const isCurrentMonth = idx + 1 === currentMonth;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => selectMonthYear(idx + 1)}
                    className={`flex h-11 items-center justify-center rounded-2xl text-xs font-bold transition-all ${
                      isCurrentMonth
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-300/40 dark:shadow-indigo-900/40"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          ) : (
            /* ── Day Grid ── */
            <div className="p-4">
              <div className="mb-2 grid grid-cols-7">
                {WEEK_DAYS.map((day) => (
                  <div
                    key={day}
                    className="py-1 text-center text-[10px] font-bold uppercase tracking-tight text-gray-400"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {pickerDays.map((day, index) => {
                  if (!day) return <div key={`empty-${index}`} />;
                  const isSelected = day === value;
                  const isToday = day === todayStr;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        onChange(day);
                        setOpen(false);
                      }}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold transition-all ${
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

              {/* Quick jump to today */}
              <button
                type="button"
                onClick={() => {
                  onChange(todayStr);
                  setOpen(false);
                }}
                className="mt-3 flex w-full items-center justify-center rounded-xl bg-gray-50 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-indigo-50 hover:text-indigo-600 dark:bg-gray-800 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
              >
                Today
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
