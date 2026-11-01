import { describe, expect, it } from 'vitest';
import { newPromotionInput } from '@/features/promotions/lib/promotion-form';
import { validatePromotionLimits } from '@/features/promotions/lib/promotion-form-validation';

describe('promotion schedule validation', () => {
  it('allows the period step before choosing the HPP basis', () => {
    expect(validatePromotionLimits(newPromotionInput())).toEqual({});
  });
  it.each(['2026-11-01T10:00:00Z', '2026-11-01T09:00:00Z'])(
    'rejects an end time that is not after the start: %s',
    end_at => {
      expect(
        validatePromotionLimits({
          ...newPromotionInput(),
          start_at: '2026-11-01T10:00:00Z',
          end_at,
        }),
      ).toHaveProperty('schedule');
    },
  );
  it('accepts an open period and a strictly later end time', () => {
    expect(
      validatePromotionLimits({
        ...newPromotionInput(),
        start_at: '2026-11-01T10:00:00Z',
        end_at: '2026-11-01T10:01:00Z',
      }),
    ).toEqual({});
  });
});
