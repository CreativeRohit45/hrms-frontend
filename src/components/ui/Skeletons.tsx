/**
 * Skeleton loading components for premium perceived performance.
 * Use in place of "Loading..." text strings throughout the app.
 */

/** Generic shimmer bar — animates width with a pulse */
export function SkeletonBar({
  className = "",
  width = "100%",
}: {
  className?: string;
  width?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700/60 ${className}`}
      style={{ width, height: "1rem" }}
    />
  );
}

/** Card skeleton matching StatCard / BalanceCard proportions */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-3xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 rounded-2xl bg-gray-200 dark:bg-gray-700/60" />
        <div className="h-4 w-16 rounded-lg bg-gray-200 dark:bg-gray-700/60" />
      </div>
      <div className="space-y-2.5">
        <div className="h-8 w-24 rounded-lg bg-gray-200 dark:bg-gray-700/60" />
        <div className="h-3 w-32 rounded-lg bg-gray-100 dark:bg-gray-800/60" />
      </div>
    </div>
  );
}

/** Table skeleton — animated rows mimicking a data table */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = "",
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      {/* Header row */}
      <div className="flex gap-4 border-b border-gray-100 bg-gray-50/60 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/40">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={`hdr-${i}`}
            className="h-3.5 flex-1 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700/60"
            style={{ maxWidth: i === 0 ? "180px" : "120px" }}
          />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`row-${rowIdx}`}
          className="flex gap-4 border-b border-gray-50 px-6 py-4 last:border-b-0 dark:border-gray-800/60"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div
              key={`cell-${rowIdx}-${colIdx}`}
              className="h-4 flex-1 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800/50"
              style={{
                maxWidth: colIdx === 0 ? "180px" : "120px",
                animationDelay: `${rowIdx * 75}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Inline skeleton for loading balance strips / quick stats */
export function SkeletonStrip({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
