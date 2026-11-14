import test from 'node:test';
import assert from 'node:assert/strict';
import { adherence, percentageChange, chronological } from '../src/services/calculations.js';

test('adherence calculates completed divided by prescribed', () => {
  assert.equal(adherence(8, 10), 80);
});

test('adherence handles zero prescribed sessions', () => {
  assert.equal(adherence(0, 0), null);
});

test('percentage change compares against the individual baseline', () => {
  assert.equal(percentageChange(108, 120), -10);
});

test('percentage change omits zero baseline', () => {
  assert.equal(percentageChange(5, 0), null);
});

test('chronological sorts records ascending', () => {
  const rows = chronological([{ date: '2026-02-02' }, { date: '2026-01-01' }]);
  assert.equal(rows[0].date, '2026-01-01');
});
