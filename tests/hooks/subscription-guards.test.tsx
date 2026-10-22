import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SubscriptionUsageData } from '@/features/subscription/types/subscription'
import { useSubscriptionGuards } from '@/features/subscription/hooks/useSubscriptionGuards'
import { usage } from '../support/fixtures'

const query = vi.hoisted(() => ({ data: undefined as SubscriptionUsageData | undefined, isLoading: false, error: null, refetch: vi.fn() }))
vi.mock('@/features/subscription/hooks/useSubscriptionUsage', () => ({ useSubscriptionUsage: () => query }))

beforeEach(() => { query.data = undefined })

describe('subscription guards', () => {
  it('uses safe defaults before usage data is available', () => {
    const { result } = renderHook(useSubscriptionGuards)
    expect(result.current).toMatchObject({ tier: 'FREE', status: 'ACTIVE', isInGracePeriod: false })
    expect(result.current.canAccessFeature('advanced_pos')).toBe(false)
    expect(result.current.isQuotaReached('products')).toBe(false)
    expect(result.current.getRemainingQuota('products')).toBe(0)
    expect(result.current.getQuotaStats('products')).toEqual({ current: 0, limit: 0, remaining: 0, percentage: 0 })
  })
  it('uses the effective tier and each feature grant', () => {
    query.data = usage({ effective_tier: 'FREE', status: 'IN_GRACE_PERIOD', is_in_grace_period: true, grace_period_until: '2026-01-10' })
    query.data.features.advanced_pos = false
    const { result } = renderHook(useSubscriptionGuards)
    expect(result.current).toMatchObject({ tier: 'FREE', isInGracePeriod: true, gracePeriodUntil: '2026-01-10' })
    expect(result.current.canAccessFeature('advanced_pos')).toBe(false)
    expect(result.current.canAccessFeature('export_reports')).toBe(true)
  })
  it.each<[number, number, boolean, number, number]>([
    [0, 10, false, 10, 0], [8, 10, false, 2, 80], [10, 10, true, 0, 100],
    [12, 10, true, 0, 100], [0, 0, true, 0, 0], [500, -1, false, Infinity, 0],
  ])('handles current=%i and limit=%i', (current, limit, reached, remaining, percentage) => {
    query.data = usage()
    query.data.quotas.products = { current: Number(current), limit: Number(limit), remaining: Number(remaining) }
    const { result } = renderHook(useSubscriptionGuards)
    expect(result.current.isQuotaReached('products')).toBe(reached)
    expect(result.current.getRemainingQuota('products')).toBe(remaining)
    expect(result.current.getQuotaStats('products').percentage).toBe(percentage)
  })
})
