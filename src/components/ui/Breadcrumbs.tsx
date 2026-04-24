import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

/**
 * Route-label mapping. Extend as new pages are added.
 * Entries with dynamic segments use `:param` which is auto-replaced
 * with the actual path segment (capitalized) at render time.
 */
const ROUTE_LABELS: Record<string, string> = {
  app: "Dashboard",
  attendance: "Attendance",
  leaves: "Leave Management",
  payroll: "Payroll",
  employees: "Employees",
  departments: "Departments",
  settings: "Settings",
  requests: "My Requests",
  "my-space": "My Space",
  shifts: "Shifts",
  holidays: "Holidays",
  locations: "Locations",
  "leave-types": "Leave Types",
  roster: "Roster",
  inbox: "Inbox",
};

function humanize(segment: string): string {
  return (
    ROUTE_LABELS[segment] ??
    segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function Breadcrumbs() {
  const { pathname } = useLocation();

  // Remove trailing slash and split
  const segments = pathname.replace(/\/+$/, "").split("/").filter(Boolean);

  // Don't show breadcrumbs on root / login
  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, idx) => {
    const path = "/" + segments.slice(0, idx + 1).join("/");
    const label = humanize(seg);
    const isLast = idx === segments.length - 1;
    return { path, label, isLast };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 px-1 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500"
    >
      <Link
        to="/app"
        className="flex items-center gap-1 text-gray-400 hover:text-indigo-500 transition-colors dark:text-gray-500 dark:hover:text-indigo-400"
      >
        <Home size={13} />
      </Link>

      {crumbs.slice(1).map((crumb) => (
        <span key={crumb.path} className="flex items-center gap-1.5">
          <ChevronRight size={12} className="text-gray-300 dark:text-gray-600" />
          {crumb.isLast ? (
            <span className="text-gray-700 dark:text-gray-200">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className="text-gray-400 hover:text-indigo-500 transition-colors dark:text-gray-500 dark:hover:text-indigo-400"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
