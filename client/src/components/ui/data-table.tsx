import React from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  className,
  emptyMessage = "No data available"
}: DataTableProps<T>) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-2xl border border-border bg-pith-card", className)}>
      <table className="w-full text-left text-sm border-collapse" role="table">
        <thead>
          <tr className="border-b border-border bg-pith-muted/50">
            {columns.map((col, idx) => (
              <th
                key={idx}
                scope="col"
                className={cn(
                  "py-3.5 px-4 font-heading font-semibold text-seed text-xs tracking-wider uppercase",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 text-center text-seed-muted text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row.id ?? rowIdx}
                className="hover:bg-pith-muted/30 transition-colors focus-within:bg-pith-muted/40"
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={cn("py-3.5 px-4 text-seed align-middle", col.className)}
                  >
                    {col.cell ? col.cell(row) : (row[col.accessorKey as keyof T] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
