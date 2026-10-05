import * as React from "react"

export function useTableData<T>(_endpoint: string, initialData: T[]) {
  const [data, setData] = React.useState<T[]>(initialData)
  const [loading, setLoading] = React.useState(false)

  // Dummy fetch function
  const fetchData = React.useCallback(async () => {
    setLoading(true)
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    // Currently returns initial data as dummy
    setData(initialData)
    setLoading(false)
  }, [initialData])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, refetch: fetchData }
}
