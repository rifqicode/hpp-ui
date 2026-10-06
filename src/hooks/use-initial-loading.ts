import * as React from "react"

/**
 * True only until `loading` has completed once. Use for first-load placeholders
 * so later refetches don't blank the page (the global overlay handles those).
 */
export function useInitialLoading(loading: boolean): boolean {
  const [done, setDone] = React.useState(false)
  if (!loading && !done) setDone(true)
  return loading && !done
}
