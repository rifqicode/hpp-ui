export function normalizeUnit(unit: string): string {
 const value = unit.trim().toLowerCase();
 return ({ gram: 'g', kilogram: 'kg', liter: 'l', litre: 'l' } as Record<string, string>)[value] || value;
}
export function getCompatibleUnits(baseUnit = ''): string[] {
 const base = normalizeUnit(baseUnit);
 if (base === 'g' || base === 'kg') return ['g', 'kg'];
 if (base === 'ml' || base === 'l') return ['ml', 'l'];
 return [baseUnit];
}
export function getQuantityInBaseUnit(quantity: number, unit = '', base = '', packageSize = 0): number {
 if (unit === 'kemasan') return quantity * packageSize;
 const from = normalizeUnit(unit || base), to = normalizeUnit(base);
 if (from === to) return quantity;
 const factors: Record<string, number> = { g: 1, kg: 1000, ml: 1, l: 1000 };
 if (!getCompatibleUnits(base).includes(from)) return NaN;
 return quantity * factors[from] / factors[to];
}
export function getCostPerRecipeUnit(cost: number, unit?: string, base?: string): number {
 return cost * getQuantityInBaseUnit(1, unit, base);
}
