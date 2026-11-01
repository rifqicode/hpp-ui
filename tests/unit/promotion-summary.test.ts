import { expect, it, vi } from 'vitest';
import { promotionService } from '@/features/promotions/services/promotion-service';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/lib/api-client', () => ({ default: { get } }));

it('uses store-scoped API totals for both statuses instead of counting the returned page', async () => {
  get.mockResolvedValueOnce({ data: { total: 42, data: [{}] } });
  get.mockResolvedValueOnce({ data: { total: 73, data: [{}] } });
  const signal = new AbortController().signal;
  expect(await promotionService.summary('store-1', signal)).toEqual({
    active_count: 42,
    inactive_count: 73,
  });
  for (const status of ['active', 'inactive']) {
    expect(get).toHaveBeenCalledWith(
      '/stores/store-1/promotions',
      expect.objectContaining({
        headers: { 'X-Store-ID': 'store-1' },
        signal,
        params: { page: 1, per_page: 1, status },
      }),
    );
  }
});
