import { expect, test } from '@playwright/test';
import setupProductReview from './fixtures/product-review.mjs';
import verifyProductUx from './fixtures/product-ux-flow.mjs';

test('product catalog and forms use the full content width and support the complete editing flow', async ({ page }) => {
  await setupProductReview(page);
  const result = await verifyProductUx(page);
  expect(result.checks).toHaveLength(4);
  expect(result.sizes.every(size => size.full && !size.overflow)).toBe(true);
});
