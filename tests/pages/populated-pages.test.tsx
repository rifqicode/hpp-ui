import type { ComponentType } from 'react'
import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import apiClient from '@/lib/api-client'
import { pageCases } from '../support/page-cases'
import { mockPageServices, resetSession } from '../support/page-services'
import { mockPopulatedPages } from '../support/populated-pages'
import { renderPage } from '../support/render'
const pages = import.meta.glob<{ default: ComponentType }>('/src/pages/**/*page.tsx')
beforeEach(() => { resetSession(); mockPageServices() })
for (const edge of [false, true]) {
  describe(edge ? 'zero-stock and missing-price states' : 'populated business pages', () => {
    for (const page of pageCases.filter(page => !page.file.startsWith('auth/') && !page.file.startsWith('landing/'))) {
      it(`renders ${page.file} with business records`, async () => {
        mockPopulatedPages(edge)
        const { default: Page } = await pages[`/src/pages/${page.file}`]()
        const { client } = renderPage(<Page />, page.entry, 'path' in page ? page.path : '*')
        const marker = edge && page.file === 'inventory/stock-detail-page.tsx' ? 'Gula Pasir' : page.text
        expect((await screen.findAllByText(marker))[0]).toBeVisible()
        await waitFor(() => expect(client.isFetching()).toBe(0))
        for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) expect(apiClient[method], `Missing fixture for ${page.file}`).not.toHaveBeenCalled()
      })
    }
  })
}
