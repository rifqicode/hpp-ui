import * as React from "react"
import { Link } from "react-router-dom"
import {
  ChevronDown,
  Filter,
  Plus,
  ArrowRightLeft,
  RefreshCcw,
} from "lucide-react"

import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

type StockStatus = "healthy" | "low" | "out"

type MaterialStockRow = {
  id: string
  name: string
  baseUnit: string
  current: number
  min: number
}

const MOCK_MATERIALS: MaterialStockRow[] = []

function getStatus(row: MaterialStockRow): StockStatus {
  if (row.current <= 0) return "out"
  if (row.current < row.min) return "low"
  return "healthy"
}

function formatStock(row: MaterialStockRow) {
  const value = Number.isInteger(row.current) ? row.current.toString() : row.current.toFixed(2)
  return `${value} ${row.baseUnit}`
}

type StatusFilter = "all" | StockStatus

type LevelFilter = "all" | "below_min"

type SortKey = "name" | "baseUnit" | "current" | "status"

type SortDir = "asc" | "desc"

function sortRows(rows: MaterialStockRow[], sortKey: SortKey, sortDir: SortDir) {
  const sorted = [...rows]
  sorted.sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1

    if (sortKey === "name") return a.name.localeCompare(b.name) * dir
    if (sortKey === "baseUnit") return a.baseUnit.localeCompare(b.baseUnit) * dir
    if (sortKey === "current") return (a.current - b.current) * dir

    const aStatus = getStatus(a)
    const bStatus = getStatus(b)
    const order: Record<StockStatus, number> = { out: 0, low: 1, healthy: 2 }
    return (order[aStatus] - order[bStatus]) * dir
  })
  return sorted
}

function StatusBadge({ status }: { status: StockStatus }) {
  if (status === "healthy") return <Badge variant="success">Healthy</Badge>
  if (status === "low") return <Badge variant="warning">Low</Badge>
  return <Badge variant="destructive">Out</Badge>
}

export default function StockListPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")
  const [levelFilter, setLevelFilter] = React.useState<LevelFilter>("all")
  const [sortKey] = React.useState<SortKey>("name")
  const [sortDir] = React.useState<SortDir>("asc")

  const filteredRows = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = MOCK_MATERIALS
    if (q) rows = rows.filter((r) => r.name.toLowerCase().includes(q))
    if (statusFilter !== "all") rows = rows.filter((r) => getStatus(r) === statusFilter)
    if (levelFilter === "below_min") rows = rows.filter((r) => r.current < r.min)
    return sortRows(rows, sortKey, sortDir)
  }, [search, statusFilter, levelFilter, sortKey, sortDir])

  function resetFilters() {
    setSearch("")
    setStatusFilter("all")
    setLevelFilter("all")
  }

  const activeFiltersCount = (search.trim() ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) + (levelFilter !== "all" ? 1 : 0)

  const columns = [
    {
      header: "Material Name",
      accessor: (row: MaterialStockRow) => (
        <Link to={`/inventory/stocks/${row.id}`} className="font-medium text-primary underline underline-offset-4 hover:opacity-90 transition-colors">
          {row.name}
        </Link>
      ),
    },
    { header: "Base Unit", accessor: (row: MaterialStockRow) => <span className="text-muted-foreground">{row.baseUnit}</span> },
    {
      header: "Current Stock",
      accessor: (row: MaterialStockRow) => (
        <div className="text-right font-mono">
          {formatStock(row)}
          <span className="ml-2 text-xs text-muted-foreground">(Min: {row.min} {row.baseUnit})</span>
        </div>
      ),
      className: "text-right",
    },
    { header: "Status", accessor: (row: MaterialStockRow) => <StatusBadge status={getStatus(row)} /> },
  ]

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Inventory Stocks</h1>
          <p className="text-sm text-muted-foreground">Monitor material stock levels and record purchases.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/inventory/purchase/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New Material
            </Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link to="/inventory/movements/new">
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Record Movement
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Stock List</CardTitle>
              <CardDescription>Search, filter, sort, and paginate your materials.</CardDescription>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{filteredRows.length} items</div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                  }}
                  placeholder="Search material name..."
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-xl">
                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                    Status
                    <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                    Status
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setStatusFilter("all")
                    }}
                    className="cursor-pointer"
                  >
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setStatusFilter("healthy")
                    }}
                    className="cursor-pointer"
                  >
                    Healthy
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setStatusFilter("low")
                    }}
                    className="cursor-pointer"
                  >
                    Low
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setStatusFilter("out")
                    }}
                    className="cursor-pointer"
                  >
                    Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-xl">
                    Stock Level
                    <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                    Stock Level
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setLevelFilter("all")
                    }}
                    className="cursor-pointer"
                  >
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setLevelFilter("below_min")
                    }}
                    className="cursor-pointer"
                  >
                    Below Min Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                className="rounded-xl"
                onClick={resetFilters}
                disabled={activeFiltersCount === 0}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* Active filter summary */}
          {activeFiltersCount > 0 && (
            <div className="text-xs text-muted-foreground">
              Filters active: {activeFiltersCount}
            </div>
          )}

          {/* Table */}
          <DataTable columns={columns} data={filteredRows} />
        </CardContent>
      </Card>
    </div>
  )
}
