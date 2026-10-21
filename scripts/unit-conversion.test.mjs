import test from 'node:test';
import assert from 'node:assert/strict';
import { getQuantityInBaseUnit, getCompatibleUnits, getCostPerRecipeUnit } from '../src/lib/units.ts';

test('purchase and recipe units preserve HPP', () => {
 assert.equal(getQuantityInBaseUnit(2, 'kg', 'g'), 2000);
 assert.equal(getQuantityInBaseUnit(125, 'g', 'kg'), 0.125);
 assert.equal(getCostPerRecipeUnit(15000, 'g', 'kg') * 125, 1875);
 assert.equal(getQuantityInBaseUnit(2, 'kemasan', 'kg', 25), 50);
 assert.equal(getQuantityInBaseUnit(250, 'ml', 'liter'), 0.25);
 assert.equal(getQuantityInBaseUnit(3, '', 'butir'), 3);
});
test('only compatible dimensions are offered', () => {
 assert.deepEqual(getCompatibleUnits('kilogram'), ['g', 'kg']);
 assert.deepEqual(getCompatibleUnits('L'), ['ml', 'l']);
 assert.deepEqual(getCompatibleUnits('butir'), ['butir']);
 assert.ok(Number.isNaN(getQuantityInBaseUnit(1, 'kg', 'ml')));
});
