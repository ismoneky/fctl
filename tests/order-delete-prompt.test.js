import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODULE_PATH = path.join(ROOT, 'utils/order-delete-prompt.js');

test('every supported order status has a distinct delete warning', async () => {
  assert.ok(fs.existsSync(MODULE_PATH), 'order delete prompt resolver must exist');
  const { getOrderDeletePrompt } = await import(pathToFileURL(MODULE_PATH));

  const expected = {
    pending: '当前订单待支付，删除后将无法继续支付该订单。',
    confirmed: '当前订单待使用，删除后预约凭证将无法查看，请确认已不再使用。',
    completed: '该订单已完成，删除后将无法再次查看订单信息。',
    cancelled: '该订单已取消，删除后将无法再次查看取消记录。',
    refunded: '该订单已退款，删除后退款记录将无法再次查看。',
    expired: '该订单已过期，删除后相关退款进度或申请入口将无法查看。',
  };

  for (const [status, prompt] of Object.entries(expected)) {
    assert.equal(getOrderDeletePrompt(status), prompt, `${status} should use its status-aware prompt`);
  }
});

test('unknown order status uses a safe fallback delete warning', async () => {
  assert.ok(fs.existsSync(MODULE_PATH), 'order delete prompt resolver must exist');
  const { getOrderDeletePrompt } = await import(pathToFileURL(MODULE_PATH));
  assert.equal(getOrderDeletePrompt('unknown'), '删除后将无法再次查看该订单。');
});
