import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ColumnDef<T> {
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  pagination?: {
    pageSize: number;
  };
  rowClassName?: (row: T) => string;
  /** Optional mobile card renderer — if provided, cards are shown on <md screens instead of the table */
  mobileCard?: (row: T, index: number) => React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  emptyState,
  pagination,
  rowClassName,
  mobileCard,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = pagination?.pageSize ?? data.length;
  
  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleData = pagination ? data.slice(startIndex, startIndex + pageSize) : data;

  const paginationBar = pagination && data.length > pageSize && (
    <div className="flex items-center justify-between px-4 py-3 mt-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-2xl">
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
        Showing <span className="font-bold text-gray-900 dark:text-white">{startIndex + 1}</span> to{" "}
        <span className="font-bold text-gray-900 dark:text-white">
          {Math.min(startIndex + pageSize, data.length)}
        </span>{" "}
        of <span className="font-bold text-gray-900 dark:text-white">{data.length}</span> entries
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-xs font-bold px-2 text-gray-700 dark:text-gray-300">
          Page {currentPage} of {totalPages}
        </div>
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* ── Desktop Table (hidden on mobile when mobileCard is provided) ── */}
      <div className={`overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 ${mobileCard ? "hidden md:block" : ""}`}>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${col.headerClassName || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              [...Array(pageSize || 5)].map((_, i) => (
                <tr key={i}>
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-16 text-center">
                  {emptyState || (
                    <div className="text-gray-500 text-sm">No records found.</div>
                  )}
                </td>
              </tr>
            ) : (
              visibleData.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className={`group transition-colors duration-100 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${rowClassName ? rowClassName(row) : ""}`}
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-5 py-3.5 ${col.className || ""}`}>
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? (row[col.accessorKey] as any)
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Card Stack (shown only on <md when mobileCard is provided) ── */}
      {mobileCard && (
        <div className="md:hidden space-y-3">
          {isLoading ? (
            [...Array(pageSize || 3)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-2xl bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="h-2.5 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
                  </div>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-800" />
              </div>
            ))
          ) : data.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-800 dark:bg-gray-900/30">
              {emptyState || <div className="text-gray-500 text-sm">No records found.</div>}
            </div>
          ) : (
            visibleData.map((row, idx) => (
              <React.Fragment key={idx}>{mobileCard(row, idx)}</React.Fragment>
            ))
          )}
        </div>
      )}

      {/* Pagination controls */}
      {paginationBar}
    </div>
  );
}
