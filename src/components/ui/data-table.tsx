import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePagination } from "@/components/ui/table-pagination"

interface Column<T> {
  header: string
  accessor: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  pageSize?: number
  emptyMessage?: string
  total?: number
  page?: number
  totalPages?: number
  onPrev?: () => void
  onNext?: () => void
  label?: string
  loading?: boolean
}

export function DataTable<T>({
  columns,
  data,
  pageSize = 10,
  emptyMessage = "No results.",
  total,
  page: serverPage,
  totalPages: serverTotalPages,
  onPrev: serverOnPrev,
  onNext: serverOnNext,
  label = "item",
  loading = false,
}: DataTableProps<T>) {
  const isServerPaged = total !== undefined && serverPage !== undefined && serverTotalPages !== undefined
  const [clientPage, setClientPage] = React.useState(1)
  const clientPageCount = Math.max(1, Math.ceil(data.length / pageSize))
  const safeClientPage = Math.min(Math.max(1, clientPage), clientPageCount)
  const start = (safeClientPage - 1) * pageSize
  const pagedData = isServerPaged ? data : data.slice(start, start + pageSize)

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20">
              {columns.map((col, i) => (
                <TableHead key={i} className={col.className}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedData.length > 0 ? (
              pagedData.map((item, i) => (
                <TableRow key={i}>
                  {columns.map((col, j) => (
                    <TableCell key={j} className={col.className}>
                      {col.accessor(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        total={isServerPaged ? total : data.length}
        displayedCount={pagedData.length}
        page={isServerPaged ? serverPage : safeClientPage}
        totalPages={isServerPaged ? serverTotalPages : clientPageCount}
        onPrev={isServerPaged ? (serverOnPrev || (() => {})) : () => setClientPage((p) => Math.max(1, p - 1))}
        onNext={isServerPaged ? (serverOnNext || (() => {})) : () => setClientPage((p) => Math.min(clientPageCount, p + 1))}
        disabled={loading}
        label={label}
      />
    </div>
  )
}
