import { ChevronDown } from "lucide-react";

interface SelectFieldProps {
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  options: { label: string; value: string | number }[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  name?: string;
  /** Compact mode — smaller height for toolbars/inline usage */
  compact?: boolean;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  className = "",
  name,
  compact = false,
}: SelectFieldProps) {
  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          name={name}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none rounded-2xl border border-gray-200 bg-white pr-10 text-sm font-semibold text-gray-800 shadow-sm outline-none transition-all hover:border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:border-gray-700 dark:focus:border-indigo-500 ${
            compact ? "h-10 px-3 text-xs rounded-xl" : "h-12 px-4"
          }`}
        >
          {placeholder && (
            <option value="">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="dark:bg-gray-900">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400 ${compact ? "right-2.5 h-3.5 w-3.5" : "right-3.5 h-4 w-4"}`} />
      </div>
    </div>
  );
}
