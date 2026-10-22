import type { ComponentType } from 'react'
import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import apiClient from '@/lib/api-client'
import { mockPageServices, resetSession } from '../support/page-services'
import { pageCases } from '../support/page-cases'
import { renderPage } from '../support/render'

const pages = import.meta.glob<{ default: ComponentType }>('/src/pages/**/*page.tsx')

beforeEach(() => {
  mockPageServices()
})

describe('page render contracts', () => {
  it('includes every page on disk, including the standalone HPP calculator', () => {
    expect(pageCases.map(p => `/src/pages/${p.file}`).sort()).toEqual(Object.keys(pages).sort())
  })

  for (const page of pageCases) {
    it(`renders ${page.file} with its real hooks and UI components`, async () => {
      resetSession(!('guest' in page && page.guest))
      const { default: Page } = await pages[`/src/pages/${page.file}`]()
      const { client } = renderPage(<Page />, page.entry, 'path' in page ? page.path : '*')
      if ('control' in page) {
        expect(await screen.findByLabelText(page.text)).toBeVisible()
      } else {
        const matches = await screen.findAllByText(page.text)
        expect(matches[0]).toBeVisible()
      }
      await waitFor(() => expect(client.isFetching()).toBe(0))
      for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
        expect(apiClient[method], `Missing service fixture while rendering ${page.file}`).not.toHaveBeenCalled()
      }
    })
  }
})
