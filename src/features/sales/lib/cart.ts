export function cartKey(variantId: string, optionIds: string[]): string {
 return JSON.stringify([variantId, [...new Set(optionIds)].sort()]);
}
