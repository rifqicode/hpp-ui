import { test, expect } from '@playwright/test';
import verifyVariants from './fixtures/variants-flow.mjs';

test('variant builder, independent BOM copy, MTO modifiers, receipt and mobile layout (mocked API)', async ({ page }) => {
 const result = await verifyVariants(page);
 expect(result.checks).toHaveLength(10);
 expect(result.postedProduct.variants.map(v => v.ingredients[0].quantity)).toEqual([15, 20]);
 expect(result.postedSale.items.map(i => i.modifier_option_ids.length)).toEqual([1, 0]);
});
