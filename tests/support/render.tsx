import type { PropsWithChildren, ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'

export function LocationDisplay() {
  const location = useLocation()
  return <output aria-label="Lokasi halaman">{location.pathname}{location.search}</output>
}

export function createWrapper(entry = '/', path = '*') {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>
      <TooltipProvider delayDuration={0}>
        <MemoryRouter initialEntries={[entry]}>
          <LocationDisplay />
          <Routes><Route path={path} element={children} /></Routes>
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  }
  return { wrapper: Wrapper, client }
}

export function renderPage(ui: ReactElement, entry = '/', path = '*') {
  const { wrapper, client } = createWrapper(entry, path)
  return { ...render(ui, { wrapper }), client }
}

export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}
