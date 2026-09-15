import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODULE_PATH = path.join(ROOT, 'utils/order-swipe.js');

async function loadSwipeHelpers() {
  assert.ok(fs.existsSync(MODULE_PATH), 'order swipe helpers must exist');
  return import(pathToFileURL(MODULE_PATH));
}

test('swipe offset follows a left drag and stays within the action width', async () => {
  const { calculateSwipeOffset } = await loadSwipeHelpers();

  assert.equal(calculateSwipeOffset(0, -20, 72), 0);
  assert.equal(calculateSwipeOffset(0, 36, 72), 36);
  assert.equal(calculateSwipeOffset(0, 120, 72), 72);
  assert.equal(calculateSwipeOffset(72, -30, 72), 42);
});

test('swipe release snaps open only after crossing the reveal threshold', async () => {
  const { settleSwipeOffset } = await loadSwipeHelpers();

  assert.equal(settleSwipeOffset(32, 72), 0);
  assert.equal(settleSwipeOffset(34, 72), 72);
});

test('delete circle fill progresses smoothly and slightly behind the drag', async () => {
  const { getDeleteFillProgress } = await loadSwipeHelpers();

  assert.equal(getDeleteFillProgress(0, 72), 0);
  const halfway = getDeleteFillProgress(36, 72);
  assert.ok(halfway > 0 && halfway < 0.5, 'half drag should produce a restrained fill');
  assert.equal(getDeleteFillProgress(72, 72), 1);
});
