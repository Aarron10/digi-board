import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DataTableProps<T> {
  data: T[];
  columns: {
    key: string;
    header: string;
    cell: (item: T) => ReactNode;
    className?: string;
  }[];
  emptyState?: ReactNode;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  emptyState,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className="px-4 py-3 text-left text-xs font-medium text-[#2C3E50]/60 uppercase tracking-wider"
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-[#2C3E50]/60"
              >
                {emptyState || "No data available"}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, i) => (
              <TableRow
                key={i}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                {columns.map((column) => (
                  <TableCell
                    key={`${i}-${column.key}`}
                    className={cn("px-4 py-3 whitespace-nowrap", column.className)}
                  >
                    {column.cell(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function StatusBadge({
  status,
  children,
}: {
  status: "success" | "warning" | "error" | "info";
  children: ReactNode;
}) {
  const variants = {
    success: "bg-[#4CAF50]/10 text-[#4CAF50]",
    warning: "bg-[#FF5722]/10 text-[#FF5722]",
    error: "bg-[#F44336]/10 text-[#F44336]",
    info: "bg-gray-100 text-[#2C3E50]/80",
  };

  return (
    <span
      className={cn(
        "text-sm px-2 py-1 rounded-full inline-flex items-center justify-center",
        variants[status]
      )}
    >
      {children}
    </span>
  );
}
